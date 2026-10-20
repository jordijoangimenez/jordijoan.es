<#
  Builds every language version of jordijoan.es from one set of templates.

    src/*.html            page templates; {{key}} marks text that differs per language
    i18n/strings.json     every translated string, all six languages side by side
    i18n/languages.json   the languages: folder, lang code, name and switcher label

  Built-in placeholders: {{lang}} {{base}} {{canonical}} {{oglocale}} {{langswitch}}

  Usage:  pwsh ./build.ps1          write the pages (root = English, /ca/ /es/ /de/ /fr/ /zh/)
          pwsh ./build.ps1 -Check   fail if any built page differs from what is committed
#>
param([switch]$Check)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding $false

# Text files are read explicitly as UTF-8, so this script stays ASCII-only and behaves the same in PowerShell 5.1 and 7
$languages = Get-Content (Join-Path $root 'i18n/languages.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$strings = Get-Content (Join-Path $root 'i18n/strings.json') -Raw -Encoding UTF8 | ConvertFrom-Json

function Get-Switcher([string]$page, $cur) {
  $file = if ($page -eq 'index.html') { '' } else { $page }
  $globe = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>'
  $lines = @('<details class="lang">',
    "          <summary class=`"icon-btn lang-btn`" aria-label=`"$($cur.label)`">$globe<span>$($cur.code)</span></summary>",
    '          <ul class="lang-menu">')
  foreach ($t in $languages) {
    $self = if ($file) { $file } else { './' }
    if ($t.id -eq $cur.id) { $href = $self }
    elseif ($cur.dir -eq '') { $href = "$($t.dir)/$file" }
    elseif ($t.dir -eq '') { $href = "../$file" }
    else { $href = "../$($t.dir)/$file" }
    $current = if ($t.id -eq $cur.id) { ' aria-current="page"' } else { '' }
    $lines += "            <li><a href=`"$href`" hreflang=`"$($t.html)`" lang=`"$($t.html)`"$current>$($t.name)</a></li>"
  }
  $lines += '          </ul>', '        </details>'
  return ($lines -join "`n")
}

$changed = @()
foreach ($tplFile in Get-ChildItem (Join-Path $root 'src') -Filter '*.html' | Sort-Object Name) {
  $page = $tplFile.Name
  $tpl = [IO.File]::ReadAllText($tplFile.FullName, $utf8) -replace "`r`n", "`n"
  foreach ($lang in $languages) {
    $builtin = @{
      lang       = $lang.html
      base       = $(if ($lang.dir) { '../' } else { '' })
      canonical  = 'https://jordijoan.es/' + $(if ($lang.dir) { "$($lang.dir)/" } else { '' }) + $(if ($page -eq 'index.html') { '' } else { $page })
      oglocale   = $lang.locale
      langswitch = Get-Switcher $page $lang
    }
    $html = [regex]::Replace($tpl, '\{\{([A-Za-z0-9_]+)\}\}', {
      param($m)
      $k = $m.Groups[1].Value
      if ($builtin.ContainsKey($k)) { return $builtin[$k] }
      $entry = $strings.$k
      if ($null -eq $entry) { throw "Unknown key {{$k}} in src/$page" }
      $v = $entry.($lang.id)
      if ($null -eq $v) { throw "Key {{$k}} has no '$($lang.id)' text" }
      return $v
    })
    $outDir = if ($lang.dir) { Join-Path $root $lang.dir } else { $root }
    $outPath = Join-Path $outDir $page
    $old = if (Test-Path $outPath) { [IO.File]::ReadAllText($outPath, $utf8) -replace "`r`n", "`n" } else { $null }
    if ($old -cne $html) {
      $changed += $(if ($lang.dir) { "$($lang.dir)/$page" } else { $page })
      if (-not $Check) {
        New-Item -ItemType Directory -Force $outDir | Out-Null
        [IO.File]::WriteAllText($outPath, $html, $utf8)
      }
    }
  }
}

if ($Check) {
  if ($changed.Count) { Write-Host "Out of date (run ./build.ps1): $($changed -join ', ')"; exit 1 }
  Write-Host 'All pages match their templates.'
} else {
  Write-Host $(if ($changed.Count) { "Updated: $($changed -join ', ')" } else { 'Nothing to update.' })
}
