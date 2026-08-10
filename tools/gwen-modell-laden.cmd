@echo off
rem Laedt das Gwen-Modell (qwen3.5-9b) mit 131k Kontext unter dem Namen,
rem den Cline anfragt, und startet den LM-Studio-Server.
rem Doppelklicken, wenn Cline den Fehler "n_ctx: 4096" meldet
rem (passiert nach jedem LM-Studio-Neustart, solange kein Modell-Standard
rem in der LM-Studio-Oberflaeche gespeichert ist).

set LMS=%USERPROFILE%\.lmstudio\bin\lms.exe

"%LMS%" unload --all
"%LMS%" load qwen/qwen3.5-9b --context-length 131072 --identifier qwen3.5-9b -y
"%LMS%" server start
"%LMS%" ps

echo.
echo Fertig - Gwen laeuft mit 131k Kontext. Dieses Fenster kann zu.
pause
