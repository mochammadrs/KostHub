export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'Test endpoint works',
    timestamp: new Date().toISOString()
  }
})
