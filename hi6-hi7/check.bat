@echo off

echo ko =======================================
echo.
echo help_err_ko.json:
node .\check_json_format.js ./help_err_ko.json

echo.
echo help_warn_ko.json:
node .\check_json_format.js ./help_warn_ko.json

echo en =======================================
echo.
echo help_err_en.json:
node .\check_json_format.js ./help_err_en.json

echo.
echo help_warn_en.json:
node .\check_json_format.js ./help_warn_en.json

pause