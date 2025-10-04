import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const team = searchParams.get('team')
  const league = searchParams.get('league')
  const split = searchParams.get('split')

  try {
    const params = new URLSearchParams()
    if (team) params.append('team', team)
    if (league) params.append('league', league)
    if (split) params.append('split', split)

    const response = await fetch(
      `https://lol-api.up.railway.app/stats/teams?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching team stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    )
  }
}
