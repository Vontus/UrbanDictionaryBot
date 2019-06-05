export interface IStatsData {
  userId: number
  interactions: IInteraction[]
}

export interface IInteraction {
  interactionType: InteractionType
  amount: number
}

export enum InteractionType {
  Message = 'messages',
  ButtonClick = 'button-clicks',
  InlineQuery = 'inline-queries'
}
