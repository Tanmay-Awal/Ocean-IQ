export const mockFloats = [
  { id: "FL-1001", region: "North Atlantic", status: "Active", battery: "89%", temp: 14.2, lastUpdate: "2 mins ago" },
  { id: "FL-1002", region: "Pacific Ocean", status: "Active", battery: "92%", temp: 22.4, lastUpdate: "5 mins ago" },
  { id: "FL-1003", region: "Indian Ocean", status: "Maintenance", battery: "12%", temp: 28.1, lastUpdate: "1 hour ago" },
  { id: "FL-1004", region: "Southern Ocean", status: "Active", battery: "75%", temp: -1.2, lastUpdate: "15 mins ago" },
  { id: "FL-1005", region: "Arctic Ocean", status: "Offline", battery: "0%", temp: -1.8, lastUpdate: "2 days ago" },
  { id: "FL-1006", region: "Mediterranean", status: "Active", battery: "64%", temp: 19.5, lastUpdate: "8 mins ago" },
]

export const tempTrends = [
  { month: "Jan", temp: 14 },
  { month: "Feb", temp: 14.2 },
  { month: "Mar", temp: 14.5 },
  { month: "Apr", temp: 15.1 },
  { month: "May", temp: 16.0 },
  { month: "Jun", temp: 17.5 },
  { month: "Jul", temp: 18.2 },
]

export const coverageData = [
  { region: "Atlantic", coverage: 85 },
  { region: "Pacific", coverage: 72 },
  { region: "Indian", coverage: 60 },
  { region: "Southern", coverage: 45 },
  { region: "Arctic", coverage: 30 },
]

export const chatHistory = [
  { id: 1, role: "assistant", content: "Hello! I am the Ocean-IQ AI. How can I assist you with float tracking and ocean analytics today?" }
]
