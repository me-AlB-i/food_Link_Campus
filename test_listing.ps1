$ErrorActionPreference = "Stop"
try {
    # 1. Login
    Write-Host "Logging in as demo_staff..."
    $loginBody = @{username="demo_staff"; password="demo123"} | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.tokens.access
    Write-Host "✅ Login Successful"

    # 2. List Food
    Write-Host "Listing food item..."
    $foodBody = @{
        name="Test Food Item $(Get-Date -Format 'HH:mm')";
        quantity=5;
        unit="plates";
        food_type="veg";
        pickup_window_end=(Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss");
        hygiene_checks=@{
            temp_check=$true;
            packaging_clean=$true;
            safe_storage=$true;
        }
    } | ConvertTo-Json -Depth 5

    $headers = @{ Authorization = "Bearer $token" }
    $foodResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/food/create/" -Method Post -Body $foodBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Food Listed Successfully: $($foodResponse.name) (ID: $($foodResponse.id))"
} catch {
    Write-Host "❌ Error: $_"
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
    exit 1
}
