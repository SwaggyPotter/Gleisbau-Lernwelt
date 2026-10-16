# Verkleinert Tims Gelaendefotos (Vault: 18-Bildbedarf-Gleisbau/fotos-tim) fuer die
# Webseite: laengste Kante 1000 px, JPEG-Qualitaet 80, EXIF-Ausrichtung angewendet.
# Aufruf: powershell -File tools/bilder-verwaltung/fotos-verkleinern.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$src = Join-Path $root 'Ki Datenspeicher\18-Bildbedarf-Gleisbau\fotos-tim'
$dst = Join-Path $root 'src\assets\bilder-tim'
New-Item -ItemType Directory -Force $dst | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 80L)
foreach ($f in Get-ChildItem $src -Filter *.jpg) {
  $out = Join-Path $dst $f.Name
  if (Test-Path $out) { continue }
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  try {
    if ($img.PropertyIdList -contains 0x0112) {
      switch ($img.GetPropertyItem(0x0112).Value[0]) {
        3 { $img.RotateFlip('Rotate180FlipNone') }
        6 { $img.RotateFlip('Rotate90FlipNone') }
        8 { $img.RotateFlip('Rotate270FlipNone') }
      }
    }
    $scale = [Math]::Min(1.0, 1000.0 / [Math]::Max($img.Width, $img.Height))
    $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Save($out, $codec, $params)
    $bmp.Dispose()
  } finally { $img.Dispose() }
}
Write-Output "Fertig: $((Get-ChildItem $dst -Filter *.jpg).Count) Dateien"
