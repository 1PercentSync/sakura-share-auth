# Telegram Bot API token
$botToken = ""

# Webhook URL (your Cloudflare Worker URL)
$webhookUrl = "https://your Cloudflare Worker URL/webhook"

# Secret token for webhook (should match the one in your worker)
$secretToken = ""

# Construct the API URL
$apiUrl = "https://api.telegram.org/bot$botToken/setWebhook"

# Prepare the request body
$body = @{
    url = $webhookUrl
    secret_token = $secretToken
    drop_pending_updates = $true
} | ConvertTo-Json

# Send the request to set the webhook
$response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body $body

# Check the response
if ($response.ok) {
    Write-Host "Webhook successfully set!"
    Write-Host "Description: $($response.description)"
} else {
    Write-Host "Failed to set webhook."
    Write-Host "Error: $($response.description)"
}