param([string]$Request,[switch]$ValidateOnly)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new()
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()
$values = Get-Content -LiteralPath $Request -Raw -Encoding UTF8 | ConvertFrom-Json
$options = @{}; $rows = [Collections.Generic.List[string]]::new()
foreach ($value in $values) {
    if ($value.StartsWith('--')) {
        $parts = $value.Substring(2) -split '=',2
        if ($parts[0] -eq 'column') { continue }
        $options[$parts[0]] = if ($parts.Length -eq 2) { $parts[1] } else { $true }
    } else { $rows.Add($value) }
}
$title = if ($options.ContainsKey('title')) { $options.title } else { 'Okayu Update' }
$text = if ($options.ContainsKey('text')) { $options.text } else { '' }
if ($ValidateOnly) { @{title=$title;text=$text;options=$options;rows=@($rows)}|ConvertTo-Json -Depth 4; exit 0 }
if ($options.ContainsKey('file-selection')) {
    if ($options.ContainsKey('directory')) {
        $picker = [Windows.Forms.FolderBrowserDialog]::new(); $picker.Description = $title
        $picker.ShowNewFolderButton = $false
        if ($picker.ShowDialog() -ne 'OK') { exit 130 }; $picker.SelectedPath
    } else {
        $picker = if ($options.ContainsKey('save')) { [Windows.Forms.SaveFileDialog]::new() } else { [Windows.Forms.OpenFileDialog]::new() }
        $picker.Title = $title
        if ($options.ContainsKey('filename')) { $picker.FileName = $options.filename }
        if ($options.ContainsKey('file-filter')) { $picker.Filter = $options.'file-filter'.Replace(' | ','|') }
        if ($picker.ShowDialog() -ne 'OK') { exit 130 }; $picker.FileName
    }
    exit 0
}
if (-not $options.ContainsKey('list')) {
    $buttons = if ($options.ContainsKey('question')) { 'OKCancel' } else { 'OK' }
    $icon = if ($options.ContainsKey('error')) { 'Error' } else { 'Information' }
    if ([Windows.Forms.MessageBox]::Show($text,$title,$buttons,$icon) -ne 'OK') { exit 130 }
    exit 0
}
$form = [Windows.Forms.Form]::new(); $form.Text = $title; $form.Size = [Drawing.Size]::new(870,470)
$form.StartPosition = 'CenterScreen'; $form.MinimizeBox = $false
$label = [Windows.Forms.Label]::new(); $label.Text = $text; $label.SetBounds(16,12,820,85); $label.Anchor = 'Top,Left,Right'; $form.Controls.Add($label)
$check = $options.ContainsKey('checklist')
$list = if ($check) { [Windows.Forms.CheckedListBox]::new() } else { [Windows.Forms.ListBox]::new() }
$list.SetBounds(16,100,820,270); $list.Anchor = 'Top,Bottom,Left,Right'; $list.HorizontalScrollbar = $true
$ids = [Collections.Generic.List[string]]::new()
if ($check) {
    $list.CheckOnClick = $true
    for ($i=0; $i -lt $rows.Count; $i+=3) { $ids.Add($rows[$i+1]); [void]$list.Items.Add($rows[$i+2],($rows[$i] -eq 'TRUE')) }
} elseif ($options.ContainsKey('hide-column')) {
    for ($i=0; $i -lt $rows.Count; $i+=4) { $ids.Add($rows[$i+3]); [void]$list.Items.Add(($rows[$i]+'  |  '+$rows[$i+1]+'  |  '+$rows[$i+2])) }
} else {
    foreach ($row in $rows) { $ids.Add($row); [void]$list.Items.Add($row) }
}
if ($list.Items.Count -gt 0) { $list.SelectedIndex = 0 }
$form.Controls.Add($list)
$ok = [Windows.Forms.Button]::new(); $ok.Text='Continuar'; $ok.SetBounds(620,390,105,30); $ok.Anchor='Bottom,Right'; $ok.DialogResult='OK'; $form.Controls.Add($ok)
$cancel = [Windows.Forms.Button]::new(); $cancel.Text='Cancelar'; $cancel.SetBounds(735,390,100,30); $cancel.Anchor='Bottom,Right'; $cancel.DialogResult='Cancel'; $form.Controls.Add($cancel)
$form.AcceptButton=$ok; $form.CancelButton=$cancel
if ($form.ShowDialog() -ne 'OK') { exit 130 }
if ($check) { (@($list.CheckedIndices | ForEach-Object { $ids[$_] }) -join ',') }
elseif ($list.SelectedIndex -ge 0) { $ids[$list.SelectedIndex] }
else { exit 130 }
