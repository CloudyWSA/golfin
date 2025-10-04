import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const player = searchParams.get('player')
  const team = searchParams.get('team')
  const champion = searchParams.get('champion')
  const league = searchParams.get('league')
  const year = searchParams.get('year')

  if (!player) {
    return NextResponse.json(
      { error: 'Player parameter is required' },
      { status: 400 }
    )
  }

  try {
    const params = new URLSearchParams()
    params.append('player', player)
    if (team) params.append('team', team)
    if (champion) params.append('champion', champion)
    if (league) params.append('league', league)
    if (year) params.append('year', year)

    const response = await fetch(
      `https://lol-api.up.railway.app/stats/players?${params.toString()}`,
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
      if (response.status === 404) {
        return NextResponse.json([], { status: 200 })
      }
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
    console.error('Error fetching player stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    )
  }
}
