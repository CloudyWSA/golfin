interface DataDragonVersion {
  version: string
}

class DataDragonService {
  private version: string | null = null
  private championCache = new Map<string, string>()

  async getLatestVersion(): Promise<string> {
    if (this.version) return this.version

    try {
      const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      const versions: string[] = await response.json()
      this.version = versions[0]
      return this.version
    } catch (error) {
      console.error("[v0] Failed to fetch Data Dragon version:", error)
      return "14.1.1"
    }
  }

  private normalizeChampionName(championName: string): string {
    const specialCases: Record<string, string> = {
      Wukong: "MonkeyKing",
      "Nunu & Willump": "Nunu",
      "Renata Glasc": "Renata",
      "K'Sante": "KSante",
      "Bel'Veth": "Belveth",
      "Cho'Gath": "Chogath",
      "Dr. Mundo": "DrMundo",
      "Jarvan IV": "JarvanIV",
      "Kai'Sa": "Kaisa",
      "Kha'Zix": "Khazix",
      "Kog'Maw": "KogMaw",
      LeBlanc: "Leblanc",
      "Lee Sin": "LeeSin",
      "Master Yi": "MasterYi",
      "Miss Fortune": "MissFortune",
      "Rek'Sai": "RekSai",
      "Tahm Kench": "TahmKench",
      "Twisted Fate": "TwistedFate",
      "Vel'Koz": "Velkoz",
      "Xin Zhao": "XinZhao",
    }

    if (specialCases[championName]) {
      return specialCases[championName]
    }

    return championName.replace(/[\s'.]/g, "")
  }

  async getChampionIconUrl(championName: string): Promise<string> {
    const normalizedName = this.normalizeChampionName(championName)

    if (this.championCache.has(normalizedName)) {
      return this.championCache.get(normalizedName)!
    }

    const version = await this.getLatestVersion()
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${normalizedName}.png`

    console.log("[v0] Fetching champion icon:", championName, "->", normalizedName, "->", url)

    this.championCache.set(normalizedName, url)
    return url
  }

  async getChampionSplashUrl(championName: string, skinNum = 0): Promise<string> {
    const normalizedName = this.normalizeChampionName(championName)
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizedName}_${skinNum}.jpg`
  }

  async getItemIconUrl(itemId: number): Promise<string> {
    const version = await this.getLatestVersion()
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`
  }

  async getSpellIconUrl(spellName: string): Promise<string> {
    const version = await this.getLatestVersion()
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spellName}.png`
  }

  async getRuneIconUrl(runeId: number): Promise<string> {
    return `https://ddragon.leagueoflegends.com/cdn/img/${this.getRuneIconPath(runeId)}`
  }

  private getRuneIconPath(runeId: number): string {
    const runeIconPaths: Record<number, string> = {
      8005: "perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png",
      8008: "perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png",
      8021: "perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png",
      8010: "perk-images/Styles/Precision/Conqueror/Conqueror.png",
      8112: "perk-images/Styles/Domination/Electrocute/Electrocute.png",
      8124: "perk-images/Styles/Domination/Predator/Predator.png",
      8128: "perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png",
      9923: "perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png",
      8214: "perk-images/Styles/Sorcery/SummonAery/SummonAery.png",
      8229: "perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png",
      8230: "perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png",
      8437: "perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
      8439: "perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
      8465: "perk-images/Styles/Resolve/Guardian/Guardian.png",
      8351: "perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png",
      8360: "perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
      8369: "perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png",
    }

    return runeIconPaths[runeId] || "perk-images/Styles/RunesIcon.png"
  }

  async getItemData(itemId: number): Promise<{ name: string; description: string } | null> {
    try {
      const version = await this.getLatestVersion()
      const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`)
      const data = await response.json()

      if (data.data && data.data[itemId]) {
        return {
          name: data.data[itemId].name,
          description: data.data[itemId].plaintext || data.data[itemId].description,
        }
      }
      return null
    } catch (error) {
      console.error("[v0] Failed to fetch item data:", error)
      return null
    }
  }
}

export const dataDragonService = new DataDragonService()
