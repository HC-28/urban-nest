$body = @{ 
    email = "jane.smith@example.com"
    password = "user1" 
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token

Write-Host "Token length: $(if ($token) { $token.Length } else { 0 })"

$headers = @{
    Authorization = "Bearer $token"
}

$fav = Invoke-RestMethod -Uri "http://localhost:8083/api/favorites/status?userId=14&propertyId=44" -Method Get -Headers $headers -SkipHttpErrorCheck

Write-Host "Favorite Status:"
$fav | ConvertTo-Json
