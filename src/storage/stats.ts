import * as jsonfile from 'jsonfile'
import * as path from 'path'
import * as fs from 'fs'
import { InteractionType, IStatsData, IInteraction } from './stats-data'
import * as moment from 'moment'
import { groupBy, flatten, sumBy, mapValues }from 'lodash'

const statsFolder = path.join(process.env.DATA_PATH || '/stats/')

async function addStats (userId: number, interactionType: InteractionType): Promise<void> {
  const today = moment()
  const todayFileName = getFileNameOfDate(today)

  let todayStats: IStatsData[]

  try {
    await fs.promises.access(todayFileName)
    todayStats = await jsonfile.readFile(todayFileName)
  } catch (_) {
    todayStats = []
  }

  const userStats = todayStats.find(userStats => userStats.userId === userId)

  if (userStats) {
    const interaction = userStats.interactions.find(interaction => interaction.interactionType === interactionType)
    if (interaction) {
      interaction.amount++
    } else {
      userStats.interactions.push({
        interactionType,
        amount: 1
      })
    }
  } else {
    todayStats.push({
      userId,
      interactions: [{
        interactionType,
        amount: 1
      }]
    })
  }

  await jsonfile.writeFile(todayFileName, todayStats, { spaces: 2 })
}

function getFileNameOfDate (date: moment.Moment) {
  return path.join(statsFolder, date.format('YYYY-MM-DD') + '.json')
}

async function getAllStats (date: moment.Moment) {
  const dateFileName = getFileNameOfDate(date)
  return jsonfile.readFile(dateFileName)
}

async function getTodayTotalStats () {
  const todayFileName = getFileNameOfDate(moment())
  const todayStats: IStatsData[] = await jsonfile.readFile(todayFileName)
  const todayInteractionsDuplicated = flatten(todayStats.map(ts => ts.interactions))
  const todayInteractions = mapValues(
    groupBy(
      todayInteractionsDuplicated, interac => interac.interactionType
    ), type => sumBy(type, 'amount')
  )

  return todayInteractions
}

export { addStats, getAllStats, getTodayTotalStats }
