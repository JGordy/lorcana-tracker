import type { Route } from "./+types/collection";
import { useLoaderData, useFetcher, data } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  Stack,
  TextInput,
  Badge,
  ActionIcon,
  Box,
  SimpleGrid,
  Paper,
  Select,
} from "@mantine/core";
import { IconSearch, IconPlus, IconMinus, IconSparkles, IconCards } from "@tabler/icons-react";
import { Query } from "appwrite";
import { authService, dbService, COLLECTIONS, type Card as LorcanaCard, type UserCollectionItemDoc, isConfigured } from "../services/appwrite";
import { Navbar } from "../components/Navbar";

// ---------------------------------------------------------
// Loader (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie");

  // Get active session user
  const user = await authService.getSessionUser();
  const userId = user ? user.$id : null;

  // Retrieve master cards catalog and user's current inventory
  const [cards, userCollection] = await Promise.all([
    dbService.getCollection<LorcanaCard>(COLLECTIONS.CARDS, [], cookieHeader),
    userId ? dbService.getCollection<UserCollectionItemDoc>(COLLECTIONS.USER_COLLECTIONS, [Query.equal("user_id", userId)], cookieHeader) : Promise.resolve([]),
  ]);

  return {
    cards,
    userCollection,
    user,
  };
}

// ---------------------------------------------------------
// Action (Runs on the Server in SSR mode)
// ---------------------------------------------------------
export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "update-quantity") {
    const userId = formData.get("userId") as string;
    const cardId = formData.get("cardId") as string;
    const quantity = parseInt(formData.get("quantity") as string, 10);
    const isFoil = formData.get("isFoil") === "true";

    const result = await dbService.updateInventory(userId, cardId, quantity, isFoil, cookieHeader);

    // If Appwrite database is not configured, send cookie header updates to match
    if (!isConfigured) {
      const allMockInventory = await dbService.getCollection<UserCollectionItemDoc>(
        COLLECTIONS.USER_COLLECTIONS,
        [],
        cookieHeader
      );
      
      // Manually apply the update to the server-side copy before serializing it
      const existingIdx = allMockInventory.findIndex(
        (item) => item.card_id === cardId && item.is_foil === isFoil && item.user_id === userId
      );
      if (existingIdx > -1) {
        if (quantity <= 0) {
          allMockInventory.splice(existingIdx, 1);
        } else {
          allMockInventory[existingIdx].quantity = quantity;
        }
      } else if (quantity > 0) {
        allMockInventory.push({
          $id: `inv-${Date.now()}`,
          user_id: userId,
          card_id: cardId,
          quantity,
          is_foil: isFoil,
        });
      }

      const serialized = encodeURIComponent(JSON.stringify(allMockInventory));
      return data(
        { success: true, item: result },
        {
          headers: {
            "Set-Cookie": `lorcana_user_inventory=${serialized}; Path=/; Max-Age=31536000; SameSite=Lax`,
          },
        }
      );
    }

    return { success: true, item: result };
  }

  return { success: false };
}

// ---------------------------------------------------------
// Color Utilities & Ink Badges Configuration
// ---------------------------------------------------------
const INK_COLORS: Record<string, string> = {
  amber: "#F5B041",
  amethyst: "#AF7AC5",
  emerald: "#2ECC71",
  ruby: "#EC7063",
  sapphire: "#5DADE2",
  steel: "#A6ACAF"
};

function getInkBadgeStyle(inkColorString: string | null) {
  if (!inkColorString) {
    return {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.15)",
      color: "#ffffff",
      textTransform: "uppercase" as const,
      fontWeight: 700,
      letterSpacing: "0.5px",
    };
  }

  const primaryInk = inkColorString.split("/")[0].trim().toLowerCase();
  const hex = INK_COLORS[primaryInk] || "#ffffff";

  return {
    backgroundColor: `${hex}1F`, // ~12% opacity background
    borderColor: `${hex}66`,     // ~40% opacity border
    color: hex,
    textTransform: "uppercase" as const,
    fontWeight: 700,
    letterSpacing: "0.5px",
  };
}

// ---------------------------------------------------------
// Special Rarity Shiny Effect
// ---------------------------------------------------------
const SPECIAL_RARITIES = new Set(["Enchanted", "Epic", "Iconic", "Promo"]);

function ShinyCardImage({ card }: { card: LorcanaCard }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setTilt({ rx: (0.5 - y) * 18, ry: (x - 0.5) * 18, gx: x * 100, gy: y * 100, active: true });
    });
  };

  const handleMouseLeave = () => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  const isSpecial = SPECIAL_RARITIES.has(card.rarity);
  const hasHolo = card.rarity === "Enchanted" || card.rarity === "Iconic";
  const hasShimmer = card.rarity === "Epic";

  if (!card.image_url) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={isSpecial ? handleMouseMove : undefined}
      onMouseLeave={isSpecial ? handleMouseLeave : undefined}
      style={{
        position: "relative",
        transform: isSpecial
          ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${tilt.active ? 1.03 : 1})`
          : undefined,
        transition: tilt.active ? "transform 0.05s linear" : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        transformStyle: "preserve-3d",
        willChange: isSpecial ? "transform" : undefined,
      }}
    >
      <img
        src={card.image_url}
        alt={card.name}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {hasHolo && (
        <div
          className="shiny-holo-layer"
          style={{
            background: tilt.active
              ? `radial-gradient(ellipse at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.28) 0%, transparent 55%),
                 linear-gradient(${tilt.gx + tilt.gy * 0.8}deg,
                   rgba(255,0,128,0.35) 0%, rgba(255,165,0,0.35) 16%, rgba(255,255,0,0.3) 32%,
                   rgba(0,255,128,0.35) 48%, rgba(0,128,255,0.35) 64%, rgba(128,0,255,0.35) 80%, rgba(255,0,128,0.35) 100%)`
              : undefined,
            opacity: tilt.active ? 1 : 0,
          }}
        />
      )}
      {hasShimmer && tilt.active && (
        <div className="shiny-shimmer-layer" />
      )}
    </div>
  );
}

// Character-to-Franchise Mapping (derived from Lorcana card catalog)
const CHARACTER_FRANCHISE_MAP: Record<string, string> = {
  "Elsa": "Frozen", "Anna": "Frozen", "Kristoff": "Frozen", "Olaf": "Frozen", "Sven": "Frozen", "Hans": "Frozen", "Marshmallow": "Frozen", "Bruni": "Frozen", "Gale": "Frozen", "Nokk": "Frozen", "Yelena": "Frozen", "Honeymaren": "Frozen", "Ryder": "Frozen",
  "Buzz Lightyear": "Toy Story", "Woody": "Toy Story", "Jessie": "Toy Story", "Rex": "Toy Story", "Slinky Dog": "Toy Story", "Bullseye": "Toy Story", "Hamm": "Toy Story", "Squeeze Toy Aliens": "Toy Story", "Aliens": "Toy Story", "Zurg": "Toy Story", "Al": "Toy Story", "Lotso": "Toy Story", "Green Army Men": "Toy Story", "Sarge": "Toy Story",
  "Carl Fredricksen": "Up", "Ellie Fredricksen": "Up", "Russell": "Up", "Dug": "Up", "Kevin": "Up", "Alpha": "Up", "Beta": "Up", "Gamma": "Up",
  "Mickey Mouse": "Mickey Mouse & Friends", "Minnie Mouse": "Mickey Mouse & Friends", "Donald Duck": "Mickey Mouse & Friends", "Daisy Duck": "Mickey Mouse & Friends", "Goofy": "Mickey Mouse & Friends", "Pluto": "Mickey Mouse & Friends", "Pete": "Mickey Mouse & Friends", "Scrooge McDuck": "Mickey Mouse & Friends", "Huey": "Mickey Mouse & Friends", "Dewey": "Mickey Mouse & Friends", "Louie": "Mickey Mouse & Friends", "Clarabelle Cow": "Mickey Mouse & Friends", "Horace Horsecollar": "Mickey Mouse & Friends", "Max Goof": "Mickey Mouse & Friends", "Ludwig Von Drake": "Mickey Mouse & Friends", "Gus Goose": "Mickey Mouse & Friends", "Pete's Bad Boys": "Mickey Mouse & Friends",
  "Aladdin": "Aladdin", "Jasmine": "Aladdin", "Genie": "Aladdin", "Jafar": "Aladdin", "Abu": "Aladdin", "Iago": "Aladdin", "Sultan": "Aladdin", "Rajah": "Aladdin", "Razoul": "Aladdin", "Cave of Wonders": "Aladdin", "Peddler": "Aladdin", "Cassim": "Aladdin", "Sa'luk": "Aladdin",
  "Cinderella": "Cinderella", "Prince Charming": "Cinderella", "Lady Tremaine": "Cinderella", "Anastasia": "Cinderella", "Drizella": "Cinderella", "Gus": "Cinderella", "Jaq": "Cinderella", "Fairy Godmother": "Cinderella", "Perla": "Cinderella", "Suzy": "Cinderella", "Lucifer": "Cinderella", "Bruno": "Cinderella", "Major": "Cinderella", "The King": "Cinderella", "Grand Duke": "Cinderella",
  "Bruno Madrigal": "Encanto", "Mirabel Madrigal": "Encanto", "Isabela Madrigal": "Encanto", "Luisa Madrigal": "Encanto", "Pepa Madrigal": "Encanto", "Dolores Madrigal": "Encanto", "Camilo Madrigal": "Encanto", "Antonio Madrigal": "Encanto", "Abuela Alma": "Encanto", "Felix Madrigal": "Encanto", "Augustin Madrigal": "Encanto", "Julieta Madrigal": "Encanto", "The Family Madrigal": "Encanto",
  "Mulan": "Mulan", "Mushu": "Mulan", "Li Shang": "Mulan", "Grandmother Fa": "Mulan", "Shan Yu": "Mulan", "Cri-Kee": "Mulan", "Khan": "Mulan", "Yao": "Mulan", "Ling": "Mulan", "Chien-Po": "Mulan", "Emperor of China": "Mulan", "General Li": "Mulan",
  "Stitch": "Lilo & Stitch", "Lilo": "Lilo & Stitch", "Jumba Jookiba": "Lilo & Stitch", "Agent Pleakley": "Lilo & Stitch", "Gantu": "Lilo & Stitch", "Dr. Hämsterviel": "Lilo & Stitch", "Nani": "Lilo & Stitch", "David Kawena": "Lilo & Stitch", "Cobra Bubbles": "Lilo & Stitch", "Grand Councilwoman": "Lilo & Stitch", "Captain Gantu": "Lilo & Stitch", "Bucky": "Lilo & Stitch",
  "Pongo": "101 Dalmatians", "Perdita": "101 Dalmatians", "Cruella De Vil": "101 Dalmatians", "Lucky": "101 Dalmatians", "Patch": "101 Dalmatians", "Rolly": "101 Dalmatians", "Penny": "101 Dalmatians", "Freckles": "101 Dalmatians", "Pepper": "101 Dalmatians", "Jasper": "101 Dalmatians", "Horace": "101 Dalmatians", "Nanny": "101 Dalmatians", "Anita Radcliffe": "101 Dalmatians", "Roger Radcliffe": "101 Dalmatians", "Pongo & Perdita": "101 Dalmatians",
  "Tramp": "Lady and the Tramp", "Lady": "Lady and the Tramp", "Trusty": "Lady and the Tramp", "Jock": "Lady and the Tramp", "Peg": "Lady and the Tramp", "Tony": "Lady and the Tramp", "Joe": "Lady and the Tramp", "Aunt Sarah": "Lady and the Tramp", "Si & Am": "Lady and the Tramp", "Bull": "Lady and the Tramp", "Boris": "Lady and the Tramp", "Toughy": "Lady and the Tramp", "Pedro": "Lady and the Tramp",
  "Kuzco": "The Emperor's New Groove", "Yzma": "The Emperor's New Groove", "Kronk": "The Emperor's New Groove", "Pacha": "The Emperor's New Groove", "Chicha": "The Emperor's New Groove", "Tipo": "The Emperor's New Groove", "Chaca": "The Emperor's New Groove", "Bucky the Squirrel": "The Emperor's New Groove",
  "Hades": "Hercules", "Hercules": "Hercules", "Megara": "Hercules", "Philoctetes": "Hercules", "Pegasus": "Hercules", "Zeus": "Hercules", "Pain": "Hercules", "Panic": "Hercules", "Cerberus": "Hercules", "Hydra": "Hercules", "Hermes": "Hercules", "Hera": "Hercules", "Nessus": "Hercules", "Cyclops": "Hercules", "Titans": "Hercules", "Lythos": "Hercules", "Hydros": "Hercules", "Pyros": "Hercules", "Stratos": "Hercules", "Muse": "Hercules", "Calliope": "Hercules", "Melpomene": "Hercules", "Terpsichore": "Hercules", "Thalia": "Hercules", "Clio": "Hercules",
  "Wendy Darling": "Peter Pan", "Peter Pan": "Peter Pan", "Tinker Bell": "Peter Pan", "Captain Hook": "Peter Pan", "Mr. Smee": "Peter Pan", "John Darling": "Peter Pan", "Michael Darling": "Peter Pan", "Lost Boys": "Peter Pan", "Slightly": "Peter Pan", "Cubby": "Peter Pan", "Nibs": "Peter Pan", "Twins": "Peter Pan", "Tiger Lily": "Peter Pan", "Great Big Little Panther": "Peter Pan", "Crocodile": "Peter Pan", "Nana": "Peter Pan", "George Darling": "Peter Pan", "Mary Darling": "Peter Pan",
  "Rufus": "The Rescuers", "Bernard": "The Rescuers", "Miss Bianca": "The Rescuers", "Madame Medusa": "The Rescuers", "Mr. Snoops": "The Rescuers", "Orville": "The Rescuers", "Evinrude": "The Rescuers", "Luke": "The Rescuers", "Ellie Mae": "The Rescuers", "Brutus & Nero": "The Rescuers",
  "Simba": "The Lion King", "Nala": "The Lion King", "Mufasa": "The Lion King", "Scar": "The Lion King", "Timon": "The Lion King", "Pumbaa": "The Lion King", "Rafiki": "The Lion King", "Zazu": "The Lion King", "Shenzi": "The Lion King", "Banzai": "The Lion King", "Ed": "The Lion King", "Sarabi": "The Lion King", "Sarafina": "The Lion King", "Kovu": "The Lion King", "Kiara": "The Lion King",
  "Moana": "Moana", "Maui": "Moana", "Heihei": "Moana", "Pua": "Moana", "Tamatoa": "Moana", "Te Kā": "Moana", "Te Fiti": "Moana", "Gramma Tala": "Moana", "Chief Tui": "Moana", "Sina": "Moana", "Kakamora": "Moana", "Mauri": "Moana",
  "Robin Hood": "Robin Hood", "Maid Marian": "Robin Hood", "Little John": "Robin Hood", "Prince John": "Robin Hood", "Sir Hiss": "Robin Hood", "Sheriff of Nottingham": "Robin Hood", "Friar Tuck": "Robin Hood", "Alan-a-Dale": "Robin Hood", "Lady Kluck": "Robin Hood", "Trigger": "Robin Hood", "Nutsy": "Robin Hood", "Otto": "Robin Hood", "Mother Rabbit": "Robin Hood", "Skippy": "Robin Hood", "Sis": "Robin Hood", "Tagalong": "Robin Hood", "Toby Turtle": "Robin Hood",
  "Ariel": "The Little Mermaid", "Prince Eric": "The Little Mermaid", "King Triton": "The Little Mermaid", "Ursula": "The Little Mermaid", "Sebastian": "The Little Mermaid", "Flounder": "The Little Mermaid", "Scuttle": "The Little Mermaid", "Chef Louis": "The Little Mermaid", "Flotsam": "The Little Mermaid", "Jetsam": "The Little Mermaid", "Grimsby": "The Little Mermaid", "Carlotta": "The Little Mermaid", "Max": "The Little Mermaid", "Harold the Seahorse": "The Little Mermaid",
  "Belle": "Beauty and the Beast", "Beast": "Beauty and the Beast", "Gaston": "Beauty and the Beast", "Lumiere": "Beauty and the Beast", "Cogsworth": "Beauty and the Beast", "Mrs. Potts": "Beauty and the Beast", "Chip": "Beauty and the Beast", "Maurice": "Beauty and the Beast", "Lefou": "Beauty and the Beast", "Monsieur D'Arque": "Beauty and the Beast", "Billette": "Beauty and the Beast", "Madame de la Grande Bouche": "Beauty and the Beast", "Plumette": "Beauty and the Beast", "Chef Bouche": "Beauty and the Beast", "Phillipe": "Beauty and the Beast", "Wardrobe": "Beauty and the Beast", "Footstool": "Beauty and the Beast",
  "Snow White": "Snow White and the Seven Dwarfs", "The Queen": "Snow White and the Seven Dwarfs", "Doc": "Snow White and the Seven Dwarfs", "Grumpy": "Snow White and the Seven Dwarfs", "Happy": "Snow White and the Seven Dwarfs", "Sleepy": "Snow White and the Seven Dwarfs", "Sneezy": "Snow White and the Seven Dwarfs", "Bashful": "Snow White and the Seven Dwarfs", "Dopey": "Snow White and the Seven Dwarfs", "The Prince": "Snow White and the Seven Dwarfs", "Huntsman": "Snow White and the Seven Dwarfs", "Magic Mirror": "Snow White and the Seven Dwarfs",
  "Baymax": "Big Hero 6", "Hiro Hamada": "Big Hero 6", "Go Go Tomago": "Big Hero 6", "Honey Lemon": "Big Hero 6", "Wasabi": "Big Hero 6", "Fred": "Big Hero 6", "Yokai": "Big Hero 6", "Tadashi Hamada": "Big Hero 6", "Aunt Cass": "Big Hero 6", "Robert Callaghan": "Big Hero 6", "Abigail Callaghan": "Big Hero 6", "Alitheia": "Big Hero 6", "Yama": "Big Hero 6",
  "Koda": "Brother Bear", "Kenai": "Brother Bear", "Denahi": "Brother Bear", "Rutt": "Brother Bear", "Tuke": "Brother Bear", "Tanana": "Brother Bear", "Tug": "Brother Bear", "Sitka": "Brother Bear",
  "Rapunzel": "Tangled", "Flynn Rider": "Tangled", "Mother Gothel": "Tangled", "Pascal": "Tangled", "Maximus": "Tangled", "Hook Hand": "Tangled", "Big Nose": "Tangled", "Stabbington Brothers": "Tangled", "Stabbington Brother": "Tangled", "Shorty": "Tangled", "Attila": "Tangled", "Vlad": "Tangled", "Ulrich": "Tangled", "Captain of the Guards": "Tangled", "King Frederic": "Tangled", "Queen Arianna": "Tangled",
  "Alice": "Alice in Wonderland", "Mad Hatter": "Alice in Wonderland", "March Hare": "Alice in Wonderland", "Cheshire Cat": "Alice in Wonderland", "Queen of Hearts": "Alice in Wonderland", "King of Hearts": "Alice in Wonderland", "White Rabbit": "Alice in Wonderland", "Caterpillar": "Alice in Wonderland", "Tweedledee & Tweedledum": "Alice in Wonderland", "Tweedledee": "Alice in Wonderland", "Tweedledum": "Alice in Wonderland", "Dormouse": "Alice in Wonderland", "Bill the Lizard": "Alice in Wonderland", "Doorknob": "Alice in Wonderland", "Walrus": "Alice in Wonderland", "Carpenter": "Alice in Wonderland", "Card Soldiers": "Alice in Wonderland", "Card Soldier": "Alice in Wonderland", "Dodo": "Alice in Wonderland", "Dinah": "Alice in Wonderland",
  "Wreck-It Ralph": "Wreck-It Ralph", "Vanellope von Schweetz": "Wreck-It Ralph", "Fix-It Felix, Jr.": "Wreck-It Ralph", "Sergeant Calhoun": "Wreck-It Ralph", "Calhoun": "Wreck-It Ralph", "King Candy": "Wreck-It Ralph", "Sour Bill": "Wreck-It Ralph", "Taffyta Muttonfudge": "Wreck-It Ralph", "Candlehead": "Wreck-It Ralph", "Rancis Fluggerbutter": "Wreck-It Ralph", "Jubileena Bing-Bing": "Wreck-It Ralph", "Snowanna Rainbeau": "Wreck-It Ralph", "Gloyd Orangeboar": "Wreck-It Ralph", "Swizzle Malarkey": "Wreck-It Ralph", "Adorabeezle Winterpop": "Wreck-It Ralph", "Torus": "Wreck-It Ralph", "Cy-Bug": "Wreck-It Ralph", "Cy-Bugs": "Wreck-It Ralph", "Gene": "Wreck-It Ralph", "Mary": "Wreck-It Ralph", "Don": "Wreck-It Ralph", "Roy": "Wreck-It Ralph", "Markowski": "Wreck-It Ralph", "General Hologram": "Wreck-It Ralph",
  "Peter Pan's Shadow": "Peter Pan", "Jiminy Cricket": "Pinocchio", "Pinocchio": "Pinocchio", "Geppetto": "Pinocchio", "Blue Fairy": "Pinocchio", "Honest John": "Pinocchio", "Gideon": "Pinocchio", "Stromboli": "Pinocchio", "Monstro": "Pinocchio", "Cleo": "Pinocchio", "Figaro": "Pinocchio", "Coachman": "Pinocchio",
  "Arthur": "The Sword in the Stone", "Merlin": "The Sword in the Stone", "Madam Mim": "The Sword in the Stone", "Archimedes": "The Sword in the Stone", "Sir Ector": "The Sword in the Stone", "Sir Kay": "The Sword in the Stone", "Black Bart": "The Sword in the Stone", "Sugar Bowl": "The Sword in the Stone",
  "Tiana": "The Princess and the Frog", "Prince Naveen": "The Princess and the Frog", "Dr. Facilier": "The Princess and the Frog", "Ray": "The Princess and the Frog", "Louis": "The Princess and the Frog", "Mama Odie": "The Princess and the Frog", "Charlotte La Bouff": "The Princess and the Frog", "Big Daddy La Bouff": "The Princess and the Frog", "Lawrence": "The Princess and the Frog", "Juju": "The Princess and the Frog"
};

const getCardFranchise = (cardName: string) => {
  const characterName = cardName.split(" - ")[0].trim();
  if (CHARACTER_FRANCHISE_MAP[characterName]) return CHARACTER_FRANCHISE_MAP[characterName];
  for (const key of Object.keys(CHARACTER_FRANCHISE_MAP)) {
    if (characterName.includes(key)) return CHARACTER_FRANCHISE_MAP[key];
  }
  return "Other";
};

// Reverse chronological release order of Lorcana sets (newest at the top)
const KNOWN_SETS = [
  "Attack of the Vine!",
  "Wilds Unknown",
  "Winterspell",
  "Whispers in the Well",
  "Fabled",
  "Reign of Jafar",
  "Archazia's Island",
  "Azurite Sea",
  "Shimmering Skies",
  "Ursula's Return",
  "Into the Inklands",
  "Rise of the Floodborn",
  "The First Chapter"
];

export default function Collection() {
  const { cards, userCollection: serverCollection, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  // Client-side persistent state for inventory (bypasses browser 4KB cookie size limits)
  const [userCollection, setUserCollection] = useState<UserCollectionItemDoc[]>([]);

  // Synchronize with localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lorcana_user_inventory");
      if (stored) {
        try {
          setUserCollection(JSON.parse(stored));
          return;
        } catch (e) {
          console.error("Failed to parse local storage inventory", e);
        }
      }
      // Fallback to server data
      setUserCollection(serverCollection);
      localStorage.setItem("lorcana_user_inventory", JSON.stringify(serverCollection));
    }
  }, [serverCollection]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInks, setSelectedInks] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>("All");
  const [selectedRarity, setSelectedRarity] = useState<string>("All");
  const [selectedCost, setSelectedCost] = useState<string>("All");
  const [selectedInkable, setSelectedInkable] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedClassification, setSelectedClassification] = useState<string>("All");
  const [selectedFranchise, setSelectedFranchise] = useState<string>("All");
  const [selectedAttack, setSelectedAttack] = useState<string>("All");
  const [selectedDefense, setSelectedDefense] = useState<string>("All");
  const [selectedLore, setSelectedLore] = useState<string>("All");

  const allClassifications = useMemo(() => {
    return Array.from(
      new Set(cards.flatMap(c => c.classifications || []))
    ).sort();
  }, [cards]);

  const allFranchises = useMemo(() => {
    return Array.from(
      new Set(cards.map(c => getCardFranchise(c.name)))
    ).sort();
  }, [cards]);

  const hasActiveFilters = 
    searchQuery !== "" ||
    selectedInks.length > 0 ||
    selectedSet !== "All" ||
    selectedRarity !== "All" ||
    selectedCost !== "All" ||
    selectedInkable !== "All" ||
    selectedFormat !== "All" ||
    selectedType !== "All" ||
    selectedClassification !== "All" ||
    selectedFranchise !== "All" ||
    selectedAttack !== "All" ||
    selectedDefense !== "All" ||
    selectedLore !== "All";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedInks([]);
    setSelectedSet("All");
    setSelectedRarity("All");
    setSelectedCost("All");
    setSelectedInkable("All");
    setSelectedFormat("All");
    setSelectedType("All");
    setSelectedClassification("All");
    setSelectedFranchise("All");
    setSelectedAttack("All");
    setSelectedDefense("All");
    setSelectedLore("All");
  };

  // Infinite Scroll state for lazy-loading grid DOM nodes
  const [visibleCount, setVisibleCount] = useState(48);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset infinite scroll pagination when filters change to keep DOM small and fast
  useEffect(() => {
    setVisibleCount(48);
  }, [
    searchQuery,
    selectedInks,
    selectedSet,
    selectedRarity,
    selectedCost,
    selectedInkable,
    selectedFormat,
    selectedType,
    selectedClassification,
    selectedFranchise,
    selectedAttack,
    selectedDefense,
    selectedLore
  ]);

  // Create a lookup of owned quantities by cardId & isFoil (memoized and supports Optimistic UI updates)
  const inventoryMap = useMemo(() => {
    const map = new Map<string, number>(); // key: `cardId_foil` or `cardId_normal`
    for (const item of userCollection) {
      map.set(`${item.card_id}_${item.is_foil ? "foil" : "normal"}`, item.quantity);
    }

    // Apply optimistic updates from active submissions
    if (fetcher.formData && fetcher.formData.get("intent") === "update-quantity") {
      const cardId = fetcher.formData.get("cardId") as string;
      const isFoil = fetcher.formData.get("isFoil") === "true";
      const quantity = parseInt(fetcher.formData.get("quantity") as string, 10);
      map.set(`${cardId}_${isFoil ? "foil" : "normal"}`, quantity);
    }

    return map;
  }, [userCollection, fetcher.formData]);

  // Handle quantity adjustment
  const handleAdjustQuantity = (cardId: string, isFoil: boolean, currentQty: number, change: number) => {
    if (!user) {
      alert("Please sign in with a demo session to add cards to your collection.");
      return;
    }
    const newQty = Math.max(0, currentQty + change);

    // Optimistically update React state & localStorage
    const updatedCollection = [...userCollection];
    const existingIdx = updatedCollection.findIndex(
      (item) => item.card_id === cardId && item.is_foil === isFoil
    );
    if (existingIdx > -1) {
      if (newQty <= 0) {
        updatedCollection.splice(existingIdx, 1);
      } else {
        updatedCollection[existingIdx].quantity = newQty;
      }
    } else if (newQty > 0) {
      updatedCollection.push({
        $id: `inv-${Date.now()}`,
        user_id: user.$id,
        card_id: cardId,
        quantity: newQty,
        is_foil: isFoil,
      });
    }
    setUserCollection(updatedCollection);
    if (typeof window !== "undefined") {
      localStorage.setItem("lorcana_user_inventory", JSON.stringify(updatedCollection));
    }

    fetcher.submit(
      {
        intent: "update-quantity",
        userId: user.$id,
        cardId,
        quantity: newQty.toString(),
        isFoil: isFoil.toString(),
      },
      { method: "post" }
    );
  };

  const inks = ["All", "Amber", "Amethyst", "Emerald", "Ruby", "Sapphire", "Steel"];
  
  // Dynamically extract unique sets present in the database catalog
  const databaseSets = useMemo(() => {
    return Array.from(new Set(cards.map((c) => c.set).filter(Boolean)));
  }, [cards]);

  // Sort sets chronologically by reverse release sequence, with any extra/promo sets sorted alphabetically at the bottom
  const sortedSets = useMemo(() => {
    return [...databaseSets].sort((a, b) => {
      const idxA = KNOWN_SETS.indexOf(a);
      const idxB = KNOWN_SETS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [databaseSets]);

  const sets = useMemo(() => ["All", ...sortedSets], [sortedSets]);

  // Filter cards catalog
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 1. Search Query
      const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Ink Colors (using Rule 1 & Rule 2 subset check)
      const cardColors = card.ink_color ? card.ink_color.split("/") : [];
      const matchesInk = selectedInks.length === 0
        ? true
        : selectedInks.length === 1
          ? (cardColors.length > 0 && cardColors.includes(selectedInks[0]))
          : (cardColors.length > 0 && cardColors.every(color => selectedInks.includes(color)));

      // 3. Set
      const matchesSet = selectedSet === "All" || card.set === selectedSet;

      // 4. Rarity
      const matchesRarity = selectedRarity === "All" || card.rarity === selectedRarity;

      // 5. Cost (Ink Cost)
      let matchesCost = true;
      if (selectedCost !== "All") {
        if (selectedCost === "8+") {
          matchesCost = card.cost >= 8;
        } else {
          matchesCost = card.cost === parseInt(selectedCost, 10);
        }
      }

      // 6. Inkable
      let matchesInkable = true;
      if (selectedInkable !== "All") {
        matchesInkable = selectedInkable === "Inkable" ? card.inkwell : !card.inkwell;
      }

      // 7. Format (Legality)
      let matchesFormat = true;
      if (selectedFormat !== "All") {
        matchesFormat = card.formats?.includes(selectedFormat.toLowerCase()) || false;
      }

      // 8. Type
      let matchesType = true;
      if (selectedType !== "All") {
        matchesType = card.type?.includes(selectedType) || false;
      }

      // 9. Classification
      let matchesClassification = true;
      if (selectedClassification !== "All") {
        matchesClassification = card.classifications?.includes(selectedClassification) || false;
      }

      // 10. Franchise
      let matchesFranchise = true;
      if (selectedFranchise !== "All") {
        matchesFranchise = getCardFranchise(card.name) === selectedFranchise;
      }

      // 11. Attack (Strength)
      let matchesAttack = true;
      if (selectedAttack !== "All") {
        if (card.strength === null) {
          matchesAttack = false;
        } else if (selectedAttack === "7+") {
          matchesAttack = card.strength >= 7;
        } else {
          matchesAttack = card.strength === parseInt(selectedAttack, 10);
        }
      }

      // 12. Defense (Willpower)
      let matchesDefense = true;
      if (selectedDefense !== "All") {
        if (card.willpower === null) {
          matchesDefense = false;
        } else if (selectedDefense === "8+") {
          matchesDefense = card.willpower >= 8;
        } else {
          matchesDefense = card.willpower === parseInt(selectedDefense, 10);
        }
      }

      // 13. Lore
      let matchesLore = true;
      if (selectedLore !== "All") {
        if (selectedLore === "4+") {
          matchesLore = card.lore >= 4;
        } else {
          matchesLore = card.lore === parseInt(selectedLore, 10);
        }
      }

      return matchesSearch && matchesInk && matchesSet && matchesRarity && matchesCost && 
             matchesInkable && matchesFormat && matchesType && matchesClassification && 
             matchesFranchise && matchesAttack && matchesDefense && matchesLore;
    });
  }, [
    cards,
    searchQuery,
    selectedInks,
    selectedSet,
    selectedRarity,
    selectedCost,
    selectedInkable,
    selectedFormat,
    selectedType,
    selectedClassification,
    selectedFranchise,
    selectedAttack,
    selectedDefense,
    selectedLore
  ]);

  // Infinite Scroll intersection observer to append cards as the user scrolls
  useEffect(() => {
    if (visibleCount >= filteredCards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 48, filteredCards.length));
        }
      },
      { rootMargin: "300px", threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [filteredCards.length, visibleCount]);

  // Sort the filtered cards to respect reverse chronological release order of sets, and by card number ascending within the same set
  const sortedFilteredCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => {
      const idxA = KNOWN_SETS.indexOf(a.set);
      const idxB = KNOWN_SETS.indexOf(b.set);
      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) {
          return idxA - idxB;
        }
      } else if (idxA !== -1) {
        return -1;
      } else if (idxB !== -1) {
        return 1;
      } else {
        const setComp = a.set.localeCompare(b.set);
        if (setComp !== 0) return setComp;
      }
      return a.number - b.number;
    });
  }, [filteredCards]);

  const slicedCards = useMemo(() => sortedFilteredCards.slice(0, visibleCount), [sortedFilteredCards, visibleCount]);

  // Calculate totals optimistically (incorporating pending update-quantity forms)
  const totals = useMemo(() => {
    let totalCardsOwned = 0;
    const uniqueCardsOwned = new Set<string>();

    // Start with server userCollection
    const localQuantities = new Map<string, number>(); // key: `cardId_foil` or `cardId_normal`
    for (const item of userCollection) {
      localQuantities.set(`${item.card_id}_${item.is_foil ? "foil" : "normal"}`, item.quantity);
    }

    // Apply optimistic updates from active submissions
    if (fetcher.formData && fetcher.formData.get("intent") === "update-quantity") {
      const cardId = fetcher.formData.get("cardId") as string;
      const isFoil = fetcher.formData.get("isFoil") === "true";
      const quantity = parseInt(fetcher.formData.get("quantity") as string, 10);
      localQuantities.set(`${cardId}_${isFoil ? "foil" : "normal"}`, quantity);
    }

    // Accumulate total counts
    for (const [key, qty] of localQuantities.entries()) {
      if (qty > 0) {
        totalCardsOwned += qty;
        const cardId = key.substring(0, key.lastIndexOf("_"));
        uniqueCardsOwned.add(cardId);
      }
    }

    return {
      totalCardsOwned,
      uniqueCardsCount: uniqueCardsOwned.size
    };
  }, [userCollection, fetcher.formData]);

  return (
    <Box mih="100vh" bg="dark.9" c="gray.1">
      <Navbar user={user} />

      <Container size="lg" py="xl">
        {/* Banner Dashboard Header */}
        <Card
          padding="lg"
          radius="md"
          withBorder
          mb="xl"
          bg="dark.8"
          style={(theme) => ({ borderColor: theme.colors.dark[7] })}
        >
          <Group justify="space-between" align="center">
            <Box>
              <Title order={2} size="lg" fw={800} mb={4}>
                Card Inventory Manager
              </Title>
              <Text size="xs" c="dimmed">
                Track your Lorcana cards (foil & non-foil counts) here. Changes save instantly and automatically update deck percentages.
              </Text>
            </Box>

            {/* Quick Stats Panel */}
            <Group gap="md">
              <Paper py={8} px="md" radius="sm" bg="dark.9" style={{ border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                <Text size="md" fw={900} variant="gradient" gradient={{ from: "violet.4", to: "indigo.4" }}>
                  {totals.totalCardsOwned}
                </Text>
                <Text size="9px" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Total Cards
                </Text>
              </Paper>
              <Paper py={8} px="md" radius="sm" bg="dark.9" style={{ border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                <Text size="md" fw={900} variant="gradient" gradient={{ from: "pink.4", to: "orange.4" }}>
                  {totals.uniqueCardsCount}
                </Text>
                <Text size="9px" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Unique Cards
                </Text>
              </Paper>
            </Group>
          </Group>
        </Card>

        {/* Workspace Layout */}
        <Grid gap="md">
          {/* Left Panel: Filters */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap="md" className="filters-sidebar">
              {/* Advanced Filters Card */}
              <Card
                padding="md"
                radius="md"
                withBorder
                bg="dark.8"
                className="filters-sidebar-card"
                style={(theme) => ({ borderColor: theme.colors.dark[7] })}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Filters
                  </Text>
                  {hasActiveFilters && (
                    <Text
                      size="xs"
                      c="violet.4"
                      fw={700}
                      style={{ cursor: "pointer" }}
                      onClick={handleResetFilters}
                    >
                      Reset All
                    </Text>
                  )}
                </Group>

                <Stack gap="sm" mt="xs">
                  {/* 1. Set */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Card Set</Text>
                    <Select
                      placeholder="All Sets"
                      data={sets.map(s => ({ value: s, label: s === "All" ? "All Sets" : s }))}
                      value={selectedSet}
                      onChange={(val) => setSelectedSet(val || "All")}
                      searchable
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 2. Rarity */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Rarity</Text>
                    <Select
                      placeholder="All Rarities"
                      data={[
                        { value: "All", label: "All Rarities" },
                        { value: "Common", label: "Common" },
                        { value: "Uncommon", label: "Uncommon" },
                        { value: "Rare", label: "Rare" },
                        { value: "Super Rare", label: "Super Rare" },
                        { value: "Legendary", label: "Legendary" },
                        { value: "Epic", label: "Epic" },
                        { value: "Enchanted", label: "Enchanted" },
                        { value: "Iconic", label: "Iconic" },
                      ]}
                      value={selectedRarity}
                      onChange={(val) => setSelectedRarity(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 3. Cost */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Ink Cost</Text>
                    <Select
                      placeholder="All Costs"
                      data={[
                        { value: "All", label: "All Costs" },
                        ...Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: String(i) })),
                        { value: "8+", label: "8+" }
                      ]}
                      value={selectedCost}
                      onChange={(val) => setSelectedCost(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 4. Inkable */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Inkwell Type</Text>
                    <Select
                      placeholder="All Types"
                      data={[
                        { value: "All", label: "All Types" },
                        { value: "Inkable", label: "Inkable" },
                        { value: "Non-Inkable", label: "Non-Inkable" }
                      ]}
                      value={selectedInkable}
                      onChange={(val) => setSelectedInkable(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 5. Legality */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Format Legality</Text>
                    <Select
                      placeholder="All Formats"
                      data={[
                        { value: "All", label: "All Formats" },
                        { value: "Core", label: "Core Legal" },
                        { value: "Infinity", label: "Infinity Legal" }
                      ]}
                      value={selectedFormat}
                      onChange={(val) => setSelectedFormat(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 6. Card Type */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Card Type</Text>
                    <Select
                      placeholder="All Types"
                      data={[
                        { value: "All", label: "All Types" },
                        { value: "Character", label: "Character" },
                        { value: "Action", label: "Action" },
                        { value: "Item", label: "Item" },
                        { value: "Location", label: "Location" }
                      ]}
                      value={selectedType}
                      onChange={(val) => setSelectedType(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 7. Classifications */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Classification</Text>
                    <Select
                      placeholder="All Classifications"
                      data={["All", ...allClassifications].map(cl => ({ value: cl, label: cl === "All" ? "All Classifications" : cl }))}
                      value={selectedClassification}
                      onChange={(val) => setSelectedClassification(val || "All")}
                      searchable
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 8. Franchise */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Franchise</Text>
                    <Select
                      placeholder="All Franchises"
                      data={["All", ...allFranchises].map(f => ({ value: f, label: f === "All" ? "All Franchises" : f }))}
                      value={selectedFranchise}
                      onChange={(val) => setSelectedFranchise(val || "All")}
                      searchable
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 9. Attack */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Attack (Strength)</Text>
                    <Select
                      placeholder="All Strength"
                      data={[
                        { value: "All", label: "All Strength" },
                        ...Array.from({ length: 7 }, (_, i) => ({ value: String(i), label: String(i) })),
                        { value: "7+", label: "7+" }
                      ]}
                      value={selectedAttack}
                      onChange={(val) => setSelectedAttack(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 10. Defense */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Defense (Willpower)</Text>
                    <Select
                      placeholder="All Willpower"
                      data={[
                        { value: "All", label: "All Willpower" },
                        ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
                        { value: "8+", label: "8+" }
                      ]}
                      value={selectedDefense}
                      onChange={(val) => setSelectedDefense(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>

                  {/* 11. Lore */}
                  <Box>
                    <Text size="11px" fw={600} c="gray.4" mb={4}>Lore Value</Text>
                    <Select
                      placeholder="All Lore"
                      data={[
                        { value: "All", label: "All Lore" },
                        ...Array.from({ length: 4 }, (_, i) => ({ value: String(i), label: String(i) })),
                        { value: "4+", label: "4+" }
                      ]}
                      value={selectedLore}
                      onChange={(val) => setSelectedLore(val || "All")}
                      allowDeselect={false}
                      size="xs"
                    />
                  </Box>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>

          {/* Right Panel: Cards Grid & Sticky Top Bar */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            {/* Sticky Header Row for Search and Inks */}
            <Card
              padding="xs"
              px="md"
              radius="md"
              withBorder
              bg="dark.8"
              className="top-filter-bar"
              mb="md"
              style={(theme) => ({
                borderColor: theme.colors.dark[7],
                backgroundColor: "rgba(20, 20, 20, 0.85)",
                backdropFilter: "blur(12px)",
              })}
            >
              <Group justify="space-between" align="center" gap="md">
                {/* Search Input */}
                <Box style={{ flex: 1, minWidth: 200, maxWidth: 350 }}>
                  <TextInput
                    placeholder="Search cards catalog..."
                    leftSection={<IconSearch size={14} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                  />
                </Box>

                {/* Ink Color Selector */}
                <Group gap="sm" align="center">
                  <Group gap={6}>
                    {[
                      { name: "Amber", color: "#F5B041" },
                      { name: "Amethyst", color: "#AF7AC5" },
                      { name: "Emerald", color: "#2ECC71" },
                      { name: "Ruby", color: "#EC7063" },
                      { name: "Sapphire", color: "#5DADE2" },
                      { name: "Steel", color: "#A6ACAF" }
                    ].map((ink) => {
                      const isSelected = selectedInks.includes(ink.name);
                      const isDimmed = selectedInks.length > 0 && !isSelected;
                      const handleInkClick = () => {
                        if (isSelected) {
                          setSelectedInks(prev => prev.filter(name => name !== ink.name));
                        } else if (selectedInks.length < 3) {
                          setSelectedInks(prev => [...prev, ink.name]);
                        }
                      };
                      return (
                        <Box
                          key={ink.name}
                          onClick={handleInkClick}
                          style={{
                            cursor: selectedInks.length >= 3 && !isSelected ? "not-allowed" : "pointer",
                            opacity: isDimmed ? 0.35 : 1,
                            filter: isDimmed ? "grayscale(80%)" : "none",
                            transform: isSelected ? "scale(1.15)" : "scale(1)",
                            transition: "all 0.2s ease",
                            borderRadius: "50%",
                            padding: 3,
                            border: isSelected ? `2px solid ${ink.color}` : "2px solid transparent",
                            backgroundColor: isSelected ? "rgba(255,255,255,0.03)" : "transparent",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 38,
                            height: 38,
                          }}
                          title={ink.name + (selectedInks.length >= 3 && !isSelected ? " (Max 3 colors)" : "")}
                        >
                          <img
                            src={`/inks/${ink.name.toLowerCase()}.svg`}
                            alt={ink.name}
                            style={{ width: 24, height: 24, display: "block" }}
                          />
                        </Box>
                      );
                    })}
                  </Group>
                  {selectedInks.length > 0 && (
                    <Text
                      size="xs"
                      c="violet.4"
                      fw={700}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedInks([])}
                    >
                      Clear
                    </Text>
                  )}
                </Group>
              </Group>
            </Card>

            {filteredCards.length === 0 ? (
              <Card padding="xl" radius="md" withBorder bg="dark.8" style={{ textAlign: "center", borderStyle: "dashed" }}>
                <Text c="dimmed" size="sm">No cards in catalog match your current filters.</Text>
              </Card>
            ) : (
              <>
                <SimpleGrid cols={{ base: 2, xs: 2, sm: 3, md: 3, lg: 4, xl: 4 }} spacing="md">
                {slicedCards.map((card) => {
                  const qtyNormal = inventoryMap.get(`${card.id}_normal`) || 0;
                  const qtyFoil = inventoryMap.get(`${card.id}_foil`) || 0;
                  const badgeStyle = getInkBadgeStyle(card.ink_color);

                  return (
                    <Card
                      key={card.$id}
                      className={`lorcana-card${card.rarity === "Enchanted" ? " shiny-enchanted-glow" : card.rarity === "Epic" ? " shiny-epic-glow" : card.rarity === "Iconic" ? " shiny-iconic-glow" : ""}`}
                      padding="xs"
                      radius="md"
                      withBorder
                      style={(theme) => ({
                        backgroundColor: "var(--mantine-color-dark-8)",
                        // Themed bottom gradient (12% opacity tint)
                        backgroundImage: `linear-gradient(180deg, rgba(37,38,43,0.98) 55%, ${badgeStyle.color}1E 100%)`,
                        borderColor: `${badgeStyle.color}45`, // ~27% opacity border on idle
                        overflow: "hidden",
                        "--hover-color": badgeStyle.color,
                        "--hover-shadow-color": `0 8px 24px ${badgeStyle.color}40`,
                      } as React.CSSProperties)}
                    >
                      {/* Top portion: Card Image */}
                      <Card.Section style={{ position: "relative", overflow: "hidden" }}>
                        {card.image_url ? (
                          <ShinyCardImage card={card} />
                        ) : (
                          <Box
                            style={{
                              aspectRatio: "3/4",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(255,255,255,0.02)",
                            }}
                          >
                            <IconCards size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                            <Text size="xs" c="dimmed" ta="center" px="xs">
                              {card.name}
                            </Text>
                          </Box>
                        )}
                      </Card.Section>

                      {/* Bottom portion: Card Info & Inventory Controls */}
                      <Stack gap="xs" mt="xs">
                        <Box style={{ minHeight: 38 }}>
                          <Text fw={800} size="sm" lineClamp={2} c="gray.1" style={{ lineHeight: 1.2 }}>
                            {card.name}
                          </Text>
                          <Text size="10px" c="dimmed" mt={4}>
                            {card.set} • #{card.number}
                          </Text>
                        </Box>

                        <SimpleGrid cols={2} spacing="xs" mt={4} style={{ borderTop: `1px solid ${badgeStyle.color}40`, paddingTop: 10 }}>
                          {/* Normal Counter */}
                          <Stack gap={4} align="center">
                            <Text size="10px" fw={700} c={qtyNormal > 0 ? badgeStyle.color : "dimmed"} style={{ textTransform: "uppercase", letterSpacing: "0.5px", opacity: qtyNormal > 0 ? 1 : 0.6 }}>
                              Normal
                            </Text>
                            <Group gap={0} bg={qtyNormal > 0 ? `${badgeStyle.color}18` : "var(--mantine-color-dark-9)"} px={4} py={2} justify="space-between" style={{ borderRadius: 20, border: qtyNormal > 0 ? `1px solid ${badgeStyle.color}50` : "1px solid rgba(255,255,255,0.06)", width: "100%", transition: "border-color 0.2s ease, background-color 0.2s ease" }}>
                              <ActionIcon
                                size="xs"
                                radius="xl"
                                variant="subtle"
                                color="gray"
                                onClick={() => handleAdjustQuantity(card.id, false, qtyNormal, -1)}
                              >
                                <IconMinus size={8} />
                              </ActionIcon>
                              <Text size="xs" fw={800} style={{ textAlign: "center" }} c={qtyNormal > 0 ? badgeStyle.color : "dimmed"}>
                                {qtyNormal}
                              </Text>
                              <ActionIcon
                                size="xs"
                                radius="xl"
                                variant="subtle"
                                color="gray"
                                onClick={() => handleAdjustQuantity(card.id, false, qtyNormal, 1)}
                              >
                                <IconPlus size={8} />
                              </ActionIcon>
                            </Group>
                          </Stack>

                          {/* Foil Counter */}
                          <Stack gap={4} align="center">
                            <Group gap={2} align="center">
                              <IconSparkles size={10} color="var(--mantine-color-pink-4)" />
                              <Text size="10px" fw={700} c="pink.4" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Foil
                              </Text>
                            </Group>
                            <Group gap={0} bg={qtyFoil > 0 ? "rgba(240, 98, 146, 0.12)" : "var(--mantine-color-dark-9)"} px={4} py={2} justify="space-between" style={{ borderRadius: 20, border: qtyFoil > 0 ? "1px solid var(--mantine-color-pink-5)" : "1px solid rgba(255,255,255,0.06)", width: "100%", transition: "border-color 0.2s ease, background-color 0.2s ease" }}>
                              <ActionIcon
                                size="xs"
                                radius="xl"
                                variant="subtle"
                                color="pink"
                                onClick={() => handleAdjustQuantity(card.id, true, qtyFoil, -1)}
                              >
                                <IconMinus size={8} />
                              </ActionIcon>
                              <Text size="xs" fw={800} c={qtyFoil > 0 ? "pink.4" : "dimmed"} style={{ textAlign: "center" }}>
                                {qtyFoil}
                              </Text>
                              <ActionIcon
                                size="xs"
                                radius="xl"
                                variant="subtle"
                                color="pink"
                                onClick={() => handleAdjustQuantity(card.id, true, qtyFoil, 1)}
                              >
                                <IconPlus size={8} />
                              </ActionIcon>
                            </Group>
                          </Stack>
                        </SimpleGrid>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
              
              {/* Infinite Scroll sentinel sensor */}
              {visibleCount < filteredCards.length && (
                <div ref={sentinelRef} style={{ height: 20, margin: "20px 0" }} />
              )}
              </>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
