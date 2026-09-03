/**
 * Health check endpoint for Render deployment health monitoring and zero-downtime deploys.
 */
export async function loader() {
    return Response.json(
        {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
        {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        },
    );
}
