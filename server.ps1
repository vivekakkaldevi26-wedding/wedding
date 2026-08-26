$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"

$root = "c:\Users\vivek\wedding"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $path = $req.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    
    $filePath = Join-Path $root $path.TrimStart('/')
    
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($ext) {
            ".html" { $res.ContentType = "text/html; charset=utf-8" }
            ".css"  { $res.ContentType = "text/css; charset=utf-8" }
            ".js"   { $res.ContentType = "application/javascript; charset=utf-8" }
            ".jpg"  { $res.ContentType = "image/jpeg" }
            ".jpeg" { $res.ContentType = "image/jpeg" }
            ".png"  { $res.ContentType = "image/png" }
            ".svg"  { $res.ContentType = "image/svg+xml" }
        }
        $res.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
        $res.AddHeader("Pragma", "no-cache")
        $res.AddHeader("Expires", "0")
        $res.AddHeader("Access-Control-Allow-Origin", "*")
        $buffer = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $res.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    $res.Close()
}
