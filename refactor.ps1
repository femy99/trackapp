$allTrackers = @("anxiety", "habit", "journal", "shower", "sleep", "steps", "tracker", "workout", "food")

if (!(Test-Path "app/components")) {
    New-Item -ItemType Directory -Path "app/components"
}

if (Test-Path "food") {
    Move-Item -Path "food" -Destination "app/components/food"
}

foreach ($t in $allTrackers) {
    if (Test-Path "app/$t/page.tsx") {
        Move-Item -Path "app/$t" -Destination "app/components/$t"
    }

    $compFolder = "app/components/$t"
    $pageFile = "$compFolder/page.tsx"
    $indexFile = "$compFolder/index.tsx"

    if (Test-Path $pageFile) {
        Rename-Item -Path $pageFile -NewName "index.tsx"
        
        $content = Get-Content -Path $indexFile -Raw
        $content = $content -replace "\.\./components/Sidebar/Sidebar", "../Sidebar/Sidebar"
        $content = $content -replace "\.\./\.\./components/Sidebar/Sidebar", "../Sidebar/Sidebar"
        Set-Content -Path $indexFile -Value $content
    }
    
    if (!(Test-Path "app/$t")) {
        New-Item -ItemType Directory -Path "app/$t"
    }

    $wrapperContent = @"
import TrackerComponent from '../components/$t';

export default function Page() {
    return <TrackerComponent />;
}
"@
    Set-Content -Path "app/$t/page.tsx" -Value $wrapperContent
}
