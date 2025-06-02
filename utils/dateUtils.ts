export const getNextDrawDate = () => {
  const now = new Date()
  const day = now.getDay() // 0 = dimanche, 3 = mercredi
  const hours = now.getHours()
  let nextDate = new Date(now)
  
  if (day === 0) {
    // Si on est dimanche
    if (hours >= 20) {
      // Après 20h -> prochain mercredi
      nextDate.setDate(nextDate.getDate() + 3)
    }
  } else if (day < 3) {
    // Entre lundi et mardi -> prochain mercredi
    nextDate.setDate(nextDate.getDate() + (3 - day))
  } else if (day === 3) {
    // Si on est mercredi
    if (hours >= 20) {
      // Après 20h -> prochain dimanche
      nextDate.setDate(nextDate.getDate() + 4)
    }
  } else {
    // Entre jeudi et samedi -> prochain dimanche
    nextDate.setDate(nextDate.getDate() + (7 - day))
  }
  
  nextDate.setHours(20, 0, 0, 0)
  return nextDate
}

export const isRegistrationOpen = () => {
  const now = new Date()
  const drawDate = getNextDrawDate()
  const timeUntilDraw = drawDate.getTime() - now.getTime()
  const fiveMinutesInMs = 5 * 60 * 1000

  return timeUntilDraw > fiveMinutesInMs
} 