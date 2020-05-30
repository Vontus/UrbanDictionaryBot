import * as jsonfile from 'jsonfile'
import * as path from 'path'
import * as fs from 'fs'
import { InteractionType, IStatsData } from './stats-data'
import * as moment from 'moment'
import { groupBy, flatten, sumBy, mapValues, uniqBy } from 'lodash'

const statsFolder = path.join(process.env.DATA_PATH || './data/', 'stats/')

export async function addStats (userId: number, interactionType: InteractionType): Promise<void> {
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

export async function getAllStats (date: moment.Moment) {
  const dateFileName = getFileNameOfDate(date)
  return jsonfile.readFile(dateFileName)
}

export async function getStatsFrom (momentDay: moment.Moment) {
  const todayFileName = getFileNameOfDate(momentDay)
  const todayStats: IStatsData[] = await jsonfile.readFile(todayFileName)
  const todayInteractionsDuplicated = flatten(todayStats.map(ts => ts.interactions))
  const todayInteractions = mapValues(
    groupBy(
      todayInteractionsDuplicated, interac => interac.interactionType
    ), type => sumBy(type, 'amount')
  )
  const uniqueUsers = uniqBy(todayStats, stat => stat.userId).map(stat => stat.userId).length

  return { ...todayInteractions, 'unique-users': uniqueUsers }
}
