param(
  [int]$TimeoutSec = 18
)

$ErrorActionPreference = 'Stop'

$sites = @(
  @{ Name = 'Apple Store'; Region = 'US/global'; Url = 'https://www.apple.com/shop/buy-iphone/iphone-15' },
  @{ Name = 'Samsung US'; Region = 'US/global'; Url = 'https://www.samsung.com/us/smartphones/galaxy-s26-ultra/buy/' },
  @{ Name = 'Lenovo US'; Region = 'US/global'; Url = 'https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/thinkpad-x1-carbon-gen-13-14-inch-intel/len101t0115' },
  @{ Name = 'IKEA US'; Region = 'US/global'; Url = 'https://www.ikea.com/us/en/p/billy-bookcase-white-00263850/' },
  @{ Name = 'Decathlon FR'; Region = 'FR/global'; Url = 'https://www.decathlon.fr/p/velo-route-cyclotourisme-rc120-disque/_/R-p-302301' },
  @{ Name = 'MediaMarkt DE'; Region = 'DE'; Url = 'https://www.mediamarkt.de/de/product/_apple-iphone-15-128-gb-schwarz-dual-sim-2909384.html' },
  @{ Name = 'Saturn DE'; Region = 'DE'; Url = 'https://www.saturn.de/de/product/_apple-iphone-15-128-gb-schwarz-dual-sim-2909384.html' },
  @{ Name = 'Fnac FR'; Region = 'FR'; Url = 'https://www.fnac.com/Apple-iPhone-15-128-Go-Noir-5G/a18496693/w-4' },
  @{ Name = 'Darty FR'; Region = 'FR'; Url = 'https://www.darty.com/nav/achat/gps_communication/telephone_mobile/telephone_portable/apple_iphone_15_128go_noir.html' },
  @{ Name = 'El Corte Ingles ES'; Region = 'ES'; Url = 'https://www.elcorteingles.es/electronica/A49589247-apple-iphone-15-128-gb-negro-movil-libre/' },
  @{ Name = 'PcComponentes ES'; Region = 'ES'; Url = 'https://www.pccomponentes.com/apple-iphone-15-128gb-negro-libre' },
  @{ Name = 'Currys UK'; Region = 'UK'; Url = 'https://www.currys.co.uk/products/apple-iphone-15-128-gb-black-10255346.html' },
  @{ Name = 'Argos UK'; Region = 'UK'; Url = 'https://www.argos.co.uk/product/3365216' },
  @{ Name = 'Bol NL'; Region = 'NL'; Url = 'https://www.bol.com/nl/nl/p/apple-iphone-15-128gb-zwart/9300000151058989/' },
  @{ Name = 'Coolblue NL'; Region = 'NL'; Url = 'https://www.coolblue.nl/product/934876/apple-iphone-15-128gb-zwart.html' },
  @{ Name = 'Komputronik PL'; Region = 'PL'; Url = 'https://www.komputronik.pl/product/858739/apple-iphone-15-128gb-black.html' },
  @{ Name = 'Alza CZ'; Region = 'CZ'; Url = 'https://www.alza.cz/iphone-15-128gb-cerny-d7911812.htm' },
  @{ Name = 'BestBuy US'; Region = 'US'; Url = 'https://www.bestbuy.com/site/apple-iphone-15-128gb-black-verizon/6443395.p' },
  @{ Name = 'Walmart US'; Region = 'US'; Url = 'https://www.walmart.com/ip/Apple-iPhone-15-128GB-Black/5064926995' },
  @{ Name = 'Target US'; Region = 'US'; Url = 'https://www.target.com/p/apple-iphone-15/-/A-89989081' },
  @{ Name = 'Newegg US'; Region = 'US'; Url = 'https://www.newegg.com/p/N82E16868110292' },
  @{ Name = 'B&H US'; Region = 'US'; Url = 'https://www.bhphotovideo.com/c/product/1782559-REG/apple_mtp03ll_a_iphone_15_128gb_black.html' },
  @{ Name = 'AliExpress'; Region = 'CN/global'; Url = 'https://www.aliexpress.com/item/1005007313261190.html' },
  @{ Name = 'JD CN'; Region = 'CN'; Url = 'https://item.jd.com/100012043978.html' },
  @{ Name = 'Rakuten JP'; Region = 'JP'; Url = 'https://item.rakuten.co.jp/keitai-god2a/iphone15-128-black/' },
  @{ Name = 'Yodobashi JP'; Region = 'JP'; Url = 'https://www.yodobashi.com/product/100000001008080349/' },
  @{ Name = 'MercadoLivre BR'; Region = 'BR'; Url = 'https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB27172600' },
  @{ Name = 'Magazine Luiza BR'; Region = 'BR'; Url = 'https://www.magazineluiza.com.br/iphone-15-apple-128gb-preto-61-48mp-ios-5g/p/238096200/te/ip15/' },
  @{ Name = 'Noon UAE'; Region = 'AE'; Url = 'https://www.noon.com/uae-en/iphone-15-128gb-black-5g-with-facetime-middle-east-version/N53432547A/p/' },
  @{ Name = 'Ozon RU'; Region = 'RU'; Url = 'https://www.ozon.ru/product/apple-iphone-15-128-gb-chernyy-1441677842/' },
  @{ Name = 'Wildberries RU'; Region = 'RU'; Url = 'https://www.wildberries.ru/catalog/212136993/detail.aspx' }
)

function ConvertTo-PlainText([string]$Value) {
  if (-not $Value) { return '' }
  return (($Value -replace '<script[\s\S]*?</script>', ' ') `
    -replace '<style[\s\S]*?</style>', ' ' `
    -replace '<[^>]*>', ' ' `
    -replace '&quot;', '"' `
    -replace '&#34;', '"' `
    -replace '&#39;', "'" `
    -replace '&apos;', "'" `
    -replace '&amp;', '&' `
    -replace '&nbsp;', ' ' `
    -replace '\s+', ' ').Trim()
}

function Get-MetaContent([string]$Html, [string[]]$Keys) {
  foreach ($key in $Keys) {
    $escaped = [regex]::Escape($key)
    $patternA = "<meta[^>]+(?:property|name|itemprop)=[""']$escaped[""'][^>]+content=[""']([^""']+)[""'][^>]*>"
    $patternB = "<meta[^>]+content=[""']([^""']+)[""'][^>]+(?:property|name|itemprop)=[""']$escaped[""'][^>]*>"
    $match = [regex]::Match($Html, $patternA, 'IgnoreCase')
    if (-not $match.Success) {
      $match = [regex]::Match($Html, $patternB, 'IgnoreCase')
    }
    if ($match.Success) {
      return ConvertTo-PlainText $match.Groups[1].Value
    }
  }
  return ''
}

function Test-Site($Site) {
  $headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'
    'Accept-Language' = 'en-US,en;q=0.9,it;q=0.8'
  }

  try {
    $response = Invoke-WebRequest -Uri $Site.Url -UseBasicParsing -MaximumRedirection 5 -TimeoutSec $TimeoutSec -SkipHttpErrorCheck -Headers $headers
    $html = [string]$response.Content
    $title = Get-MetaContent $html @('og:title', 'twitter:title')
    if (-not $title -and $html -match '<title[^>]*>([\s\S]*?)</title>') {
      $title = ConvertTo-PlainText $Matches[1]
    }
    $price = Get-MetaContent $html @('product:price:amount', 'og:price:amount')
    if (-not $price -and $html -match '"price"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)') {
      $price = $Matches[1]
    }
    if (-not $price) {
      $text = ConvertTo-PlainText $html.Substring(0, [Math]::Min(500000, $html.Length))
      if ($text -match '(EUR|USD|GBP|JPY|RUB|BRL|AED|R\$|\$)\s?[0-9][0-9.,\s]*|[0-9][0-9.,\s]*\s?(EUR|USD|GBP|JPY|RUB|BRL|AED)') {
        $price = $Matches[0]
      }
    }
    $hasImage = [bool](Get-MetaContent $html @('og:image', 'twitter:image', 'image')) -or ($html -match '"image"\s*:') 
    $hasJsonLdProduct = ($html -match 'application/ld\+json') -and ($html -match '"@type"\s*:\s*"?Product')
    $blocked = ([int]$response.StatusCode -in 401,403,429,451,498) -or ($html -match 'captcha|robot or human|access denied|verify you are human|attention required|enable cookies|forbidden|blocked|antibot|pardon our interruption|unusual traffic|just a moment')
    $signals = @($title, $price, $hasImage, $hasJsonLdProduct) | Where-Object { $_ }
    $compatibility = if ($blocked) { 'Blocked' } elseif ([int]$response.StatusCode -ge 400) { 'Failed' } elseif ($signals.Count -ge 3) { 'OK' } elseif ($signals.Count -ge 2) { 'Partial' } else { 'Weak' }

    [pscustomobject]@{
      Site = $Site.Name
      Region = $Site.Region
      Status = [int]$response.StatusCode
      Result = $compatibility
      Title = [bool]$title
      Price = [bool]$price
      Image = [bool]$hasImage
      JsonLd = [bool]$hasJsonLdProduct
      Note = if ($title) { $title.Substring(0, [Math]::Min(70, $title.Length)) } else { '' }
    }
  } catch {
    [pscustomobject]@{
      Site = $Site.Name
      Region = $Site.Region
      Status = 'error'
      Result = if ($_.Exception.Message -match 'timeout|canceled') { 'Timeout' } else { 'Failed' }
      Title = $false
      Price = $false
      Image = $false
      JsonLd = $false
      Note = $_.Exception.Message
    }
  }
}

$results = foreach ($site in $sites) {
  Test-Site $site
}

$results | Sort-Object Region, Site | Format-Table -AutoSize
Write-Host ''
Write-Host 'Summary:'
$results | Group-Object Result | Sort-Object Name | Format-Table Name, Count -AutoSize
