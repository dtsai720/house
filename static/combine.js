var Timer = null;
var TotalSeconds;
var RoundTime = 0;
var TimeWasReset = true;
var localCursor = 0;
var cursor = 0;
var lettersTypedCorrectly = 0;
var lettersTypedIncorrectly = 0;
var badEntriesDeleted = 0;
var totalEntriesTyped = 0;
var wordsTyped = 0;
var blockDiv = null;
var lineDiv = null;
var textString = "";
var deletes = 0;
var lineDivText = null;
var lineNum = 0;
var blockDivText = ["", "", "", ""];
var badEntryChars = [];
var cutoff = 0;
var phaseShift = 0;
var minCursorReplaceStart = 0;
var timeoutStart = 0;
var mobileTextCount = 0;
var mobileText = "";
var cleanTextString;
var letterMistakes = {};
var letterPercentMisses = {};
var letterCounts = {};
var letterResponseTimes = {};
var keyInputTime = 0;
var responseTimeStart = 0;
var savedResponseTimeStart = 0;
var responseTime = 0;
var TestInfo = {};
var textToType;
var gettingText = false;
var shortWidthCutoff = 801;
var MAX_CHARS_IN_LINE = 42;
var HALF_MAX_LINE_CHARS = Math.floor(MAX_CHARS_IN_LINE / 2);
Date.now = Date.now || function() {
    return +new Date;
}
;
function InitializeTimer_block(Time, TimerID) {
    if ($(window).width() < shortWidthCutoff) {
        MAX_CHARS_IN_LINE = 34;
    } else {
        MAX_CHARS_IN_LINE = 42;
    }
    cursor = 24;
    localCursor = 24;
    cutoff = 0;
    lineNum = 0;
    blockDivText[0] = "";
    blockDivText[1] = "";
    blockDivText[2] = "";
    blockDivText[3] = "";
    badEntryChars = [];
    Timer = document.getElementById(TimerID);
    TotalSeconds = Time;
    if (!gettingText) {
        gettingText = true;
        GetText();
    }
}
function CreateTimer_block(input, TimerID, Time) {
    keyInputTime = (new Date()).valueOf();
    var tempBlockDivStr = new Array("","","","");
    var NUM_LINES = 4;
    if (TotalSeconds == undefined || TimeWasReset) {
        cursor = 24;
        localCursor = 24;
        TimeWasReset = false;
        RoundTime = Time;
        Timer = document.getElementById(TimerID);
        TotalSeconds = Time;
        UpdateTimer()
        timeoutStart = (new Date).getTime();
        window.setTimeout("Tick()", 1000);
    }
    if (TimeWasReset) {
        TotalSeconds = Time;
        TimeWasReset = false;
    }
    if (TotalSeconds == 0) {
        return false;
    }
    var newRTEText = "";
    var RTELetter = blockDivText[lineNum].substring(localCursor, (localCursor + 1));
    var key_entered = input;
    var keyLayoutSelected = $('#keyLayoutSelected').val().toUpperCase();
    if (typeof key_entered === "object") {
        if (keyLayoutSelected == "DVORAK") {
            key_entered = d_keycode.d_getValueByEvent(input);
        } else if (keyLayoutSelected == "QWERTY_UK") {
            key_entered = UK_QWERTY_keycode.UK_QWERTY_getValueByEvent(input);
        } else if (keyLayoutSelected == "COLEMAK") {
            key_entered = cole_keycode.cole_getValueByEvent(input);
        } else if (keyLayoutSelected == "AZERTY") {
            key_entered = AZERTY_keycode.AZERTY_getValueByEvent(input);
        } else if (keyLayoutSelected == "QWERTZ") {
            key_entered = QWERTZ_keycode.QWERTZ_getValueByEvent(input);
        } else if (keyLayoutSelected == "QWERTZ_SF") {
            key_entered = QWERTZ_SF_keycode.QWERTZ_SF_getValueByEvent(input);
        } else {
            key_entered = keycode.getValueByEvent(input);
        }
    }
    var functionKeyPressed = !(/^.$/.test(key_entered));
    if ((!functionKeyPressed && responseTimeStart != 0) || RTELetter == "?") {
        if (savedResponseTimeStart != 0) {
            responseTimeStart = savedResponseTimeStart;
            savedResponseTimeStart = 0;
        }
        responseTime = keyInputTime - responseTimeStart;
        if (RTELetter in letterCounts) {
            letterCounts[RTELetter] = letterCounts[RTELetter] + 1;
            letterResponseTimes[RTELetter] = letterResponseTimes[RTELetter] + responseTime;
            if (RTELetter in letterMistakes) {
                letterPercentMisses[RTELetter] = Math.round((letterMistakes[RTELetter] / letterCounts[RTELetter]) * 100);
            }
        } else {
            letterCounts[RTELetter] = 1;
            letterResponseTimes[RTELetter] = responseTime;
        }
    } else if (functionKeyPressed && savedResponseTimeStart == 0) {
        savedResponseTimeStart = responseTimeStart;
    }
    if ((key_entered == " " && input.ctrlKey) || (key_entered == "↵" && input.ctrlKey))
        return false;
    if (key_entered == RTELetter) {
        if (RTELetter == " ") {
            newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "goodSpace" + blockDivText[lineNum].substring(localCursor - 2);
            wordsTyped++;
        } else {
            newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "goodEntry" + blockDivText[lineNum].substring(localCursor - 2);
        }
        cursor += 32;
        localCursor += 32;
        lettersTypedCorrectly += 1;
        totalEntriesTyped += 1;
        if (phaseShift != 0) {
            phaseShift = 0;
        }
    } else if (!functionKeyPressed) {
        if (phaseShift != 0) {
            if (phaseShift == 1) {
                if (key_entered == blockDivText[lineNum].substring(localCursor + 32, localCursor + 33)) {
                    var shiftRight = true;
                }
            } else {
                var lastEntry;
                if (blockDivText[lineNum].substring(localCursor - 43, localCursor - 34) == "bad_Entry" && badEntryChars.length > 0) {
                    lastEntry = badEntryChars[badEntryChars.length - 1];
                } else {
                    lastEntry = blockDivText[lineNum].substring(localCursor - 32, localCursor - 31)
                }
                if (key_entered == lastEntry) {
                    var shiftLeft = true;
                }
            }
            phaseShift = 0;
        } else {
            if (key_entered == blockDivText[lineNum].substring(localCursor + 32, localCursor + 33)) {
                if ($('#psCheckbox').is(':checked')) {
                    phaseShift = 1;
                }
            } else {
                var lastEntry;
                if (blockDivText[lineNum].substring(localCursor - 43, localCursor - 34) == "bad_Entry" && badEntryChars.length > 0) {
                    lastEntry = badEntryChars[badEntryChars.length - 1];
                } else {
                    lastEntry = blockDivText[lineNum].substring(localCursor - 32, localCursor - 31)
                }
                if (key_entered == lastEntry) {
                    if ($('#psCheckbox').is(':checked')) {
                        phaseShift = -1;
                    }
                }
            }
        }
        if (shiftRight) {
            newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "phaseRght" + blockDivText[lineNum].substring(localCursor - 2, localCursor + 21) + "goodEntry" + blockDivText[lineNum].substring(localCursor + 30);
            cursor += 32;
            localCursor += 32;
            lettersTypedIncorrectly -= 1;
            lettersTypedCorrectly += 1;
            shiftRight = false;
        } else if (shiftLeft) {
            newRTEText = blockDivText[lineNum].substring(0, localCursor - 43) + "phaseLeft" + blockDivText[lineNum].substring(localCursor - 34);
            cursor -= 32;
            localCursor -= 32;
            lettersTypedIncorrectly -= 1;
            lettersTypedCorrectly += 1;
            shiftLeft = false;
        } else if (blockDivText[lineNum].substring(localCursor, localCursor + 1) == " ") {
            if ($('#colorHighlightingMode').val() == "NO_COLOR_HIGHLIGHTS") {
                badEntryChars.push(blockDivText[lineNum].substring(localCursor, localCursor + 1));
                newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "bad_Space" + blockDivText[lineNum].substring(localCursor - 2, localCursor) + key_entered + blockDivText[lineNum].substring(localCursor + 1);
            } else {
                newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "bad_Space" + blockDivText[lineNum].substring(localCursor - 2);
            }
            wordsTyped++;
        } else {
            if ($('#colorHighlightingMode').val() == "NO_COLOR_HIGHLIGHTS") {
                badEntryChars.push(blockDivText[lineNum].substring(localCursor, localCursor + 1));
                newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "bad_Entry" + blockDivText[lineNum].substring(localCursor - 2, localCursor) + key_entered + blockDivText[lineNum].substring(localCursor + 1);
            } else {
                newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "bad_Entry" + blockDivText[lineNum].substring(localCursor - 2);
            }
            if (responseTime != 0) {
                if (RTELetter in letterMistakes) {
                    letterMistakes[RTELetter] = letterMistakes[RTELetter] + 1;
                } else {
                    letterMistakes[RTELetter] = 1;
                }
                letterPercentMisses[RTELetter] = Math.round((letterMistakes[RTELetter] / letterCounts[RTELetter]) * 100);
            }
        }
        cursor += 32;
        localCursor += 32;
        lettersTypedIncorrectly += 1;
        totalEntriesTyped += 1;
    } else if (key_entered == "backspace") {
        cursor -= 32;
        functionKeyPressed = false;
        if (localCursor == 24) {
            var newLineNum = (lineNum + (NUM_LINES - 1)) % NUM_LINES;
            var newLocalCursor = blockDivText[newLineNum].length - 8;
            if (blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) != "plainText" && cursor > 24) {
                if (blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) == "bad_Space") {
                    badEntriesDeleted += 1;
                    totalEntriesTyped -= 1;
                    wordsTyped--;
                } else if (blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) == "goodSpace") {
                    wordsTyped--;
                } else if (blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) == "bad_Entry" || blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) == "phaseLeft" || blockDivText[newLineNum].substring(newLocalCursor - 11, newLocalCursor - 2) == "phaseRght") {
                    badEntriesDeleted += 1;
                    totalEntriesTyped -= 1;
                    if (badEntryChars.length > 0) {
                        var originalChar = badEntryChars.pop();
                        blockDivText[newLineNum] = blockDivText[newLineNum].substring(0, newLocalCursor) + originalChar + blockDivText[newLineNum].substring(newLocalCursor + 1);
                    }
                }
                blockDivText[lineNum] = blockDivText[lineNum].substring(0, localCursor - 11) + "plainText" + blockDivText[lineNum].substring(localCursor - 2);
                lineNum = newLineNum;
                localCursor = newLocalCursor;
            } else {
                cursor += 32;
                deletes--;
            }
            newRTEText = blockDivText[lineNum].substring(0, localCursor - 11) + "nxtLetter" + blockDivText[lineNum].substring(localCursor - 2);
        } else {
            localCursor -= 32;
            if (blockDivText[lineNum].substring(localCursor - 11, localCursor - 2) == "bad_Space" || blockDivText[lineNum].substring(localCursor - 11, localCursor - 2) == "bad_Entry" || blockDivText[lineNum].substring(localCursor - 11, localCursor - 2) == "phaseLeft") {
                badEntriesDeleted += 1;
                totalEntriesTyped -= 1;
                if (badEntryChars.length > 0) {
                    var originalChar = badEntryChars.pop();
                    blockDivText[lineNum] = blockDivText[lineNum].substring(0, localCursor) + originalChar + blockDivText[lineNum].substring(localCursor + 1);
                }
            }
            if (blockDivText[lineNum].substring(localCursor - 11, localCursor - 2) == "bad_Space") {
                wordsTyped--;
            }
            if (blockDivText[lineNum].substring(localCursor - 11, localCursor - 2) == "goodSpace") {
                wordsTyped--;
            }
            newRTEText = blockDivText[lineNum].substring(0, (localCursor + 21) % blockDivText[lineNum].length) + "plainText" + blockDivText[lineNum].substring((localCursor + 30) % blockDivText[lineNum].length);
            newRTEText = newRTEText.substring(0, localCursor - 11) + "nxtLetter" + newRTEText.substring(localCursor - 2);
        }
        deletes++;
    }
    if (localCursor > blockDivText[lineNum].length) {
        if (blockDivText[lineNum].length > 0)
            blockDivText[(lineNum + 1) % NUM_LINES] = blockDivText[(lineNum + 1) % NUM_LINES].substring(0, 13) + "nxtLetter" + blockDivText[(lineNum + 1) % NUM_LINES].substring(22);
    } else {
        newRTEText = newRTEText.substring(0, (localCursor - 11)) + "nxtLetter" + newRTEText.substring(localCursor - 2);
    }
    if (localCursor > blockDivText[lineNum].length) {
        if (cursor > (minCursorReplaceStart * 32)) {
            if (deletes == 0) {
                if (textString[cutoff].search(/(\r\n|\n|\r)/) == 0)
                    cutoff++;
                tempStr = textString.substring(cutoff, (MAX_CHARS_IN_LINE * (i + 1)) - ((MAX_CHARS_IN_LINE * i) - cutoff));
                var localCutoff = tempStr.search(/(\r\n|\n|\r|↵)/);
                if (localCutoff < 1) {
                    localCutoff = tempStr.lastIndexOf(" ") + 1;
                    if (localCutoff == 0) {
                        localCutoff = MAX_CHARS_IN_LINE;
                    }
                    blockDivText[(lineNum + (NUM_LINES - 1)) % NUM_LINES] = "";
                    for (j = 0; j < localCutoff; j++) {
                        blockDivText[(lineNum + (NUM_LINES - 1)) % NUM_LINES] += '<span class="plainText">' + tempStr.substring(j, j + 1) + '</span>';
                    }
                    cutoff += localCutoff;
                } else {
                    var tempStr2 = tempStr.substring(0, localCutoff + 1);
                    if (tempStr2.search(/(↵)/) < 1)
                        tempStr2 = tempStr2.replace(/(\r\n|\n|\r|\s\r\n|\s\n|\s\r)/, " ");
                    blockDivText[(lineNum + (NUM_LINES - 1)) % NUM_LINES] = "";
                    for (j = 0; j < tempStr2.length; j++) {
                        blockDivText[(lineNum + (NUM_LINES - 1)) % NUM_LINES] += '<span class="plainText">' + tempStr2.substring(j, j + 1) + '</span>';
                    }
                    cutoff += localCutoff + 1;
                }
            }
        }
        blockDivText[lineNum] = newRTEText;
        tempBlockDivStr[0] = blockDivText[0];
        tempBlockDivStr[1] = blockDivText[1];
        tempBlockDivStr[2] = blockDivText[2];
        tempBlockDivStr[3] = blockDivText[3];
        blockDiv.innerHTML = formatForInnerHTML_block(tempBlockDivStr);
        localCursor = 24;
        lineNum++;
        lineNum = lineNum % 4;
    } else if (!functionKeyPressed) {
        blockDivText[lineNum] = newRTEText;
        tempBlockDivStr[0] = blockDivText[0];
        tempBlockDivStr[1] = blockDivText[1];
        tempBlockDivStr[2] = blockDivText[2];
        tempBlockDivStr[3] = blockDivText[3];
        blockDiv.innerHTML = formatForInnerHTML_block(tempBlockDivStr);
    }
    if (deletes > 0 && input.keyCode != 8) {
        deletes--;
    }
    responseTimeStart = (new Date()).valueOf();
    return false;
}
function Tick() {
    var timeoutEnd = 0;
    if (TotalSeconds <= 1) {
        TotalSeconds = 0;
        UpdateTimer()
        Timer.innerHTML = "&nbsp;00:00&nbsp;";
        UpdateStats()
        TimeEnd();
        return;
    }
    if (!TimeWasReset) {
        timeoutEnd = (new Date).getTime();
        TotalSeconds -= (timeoutEnd - timeoutStart) / 1000;
        UpdateTimer()
        timeoutStart = (new Date).getTime();
        window.setTimeout("Tick()", 1000);
    }
    UpdateStats()
}
function UpdateTimer() {
    var Seconds = TotalSeconds;
    var Minutes = Math.floor(Seconds / 60);
    Seconds -= Minutes * (60);
    var TimeStr = (LeadingZero(Minutes) + ":" + LeadingZero(Math.round(Seconds)))
    Timer.innerHTML = TimeStr;
}
function LeadingZero(Time) {
    return (Time < 10) ? "0" + Time : +Time;
}
function Reset(ResetTime, TimerID) {
    Timer = document.getElementById(TimerID);
    TotalSeconds = ResetTime;
    lettersTypedCorrectly = 0;
    lettersTypedIncorrectly = 0;
    badEntriesDeleted = 0;
    totalEntriesTyped = 0;
    wordsTyped = 0;
    letterMistakes = {};
    letterPercentMisses = {};
    letterCounts = {};
    letterResponseTimes = {};
    UpdateTimer();
    UpdateStats();
    InitializeTimer_block(ResetTime, TimerID);
    TimeWasReset = true;
    mobileTextCount = 0;
    mobileText = "";
    $('#mobileTextArea').val("");
    $('.mainDivInputs').focus();
    TimeBegin();
    updateLoggedInInfo();
}
function TimeBegin() {
    $("#timer").css("background-color", "transparent");
    $("#divCover").css("z-index", "0");
    $('#PRIW').hide();
    $("#resultDivContainer").hide('medium', function() {
        $('.mainDivInputs').focus();
        $('#centerConsole').removeClass("expanded");
        $('#rightSkyAd').removeClass("expanded");
    });
}
function TimeEnd() {
    TestInfo.WPM = pad(getNetWPM(), 3);
    TestInfo.acc = pad((getAccuracy() * 10), 3);
    TestInfo.endTS = Math.round(Date.now() / 1000);
    TestInfo.testLength = $('#timeTypeSelected').val();
    TestInfo.textType = $('#textTypeSelected').val();
    TestInfo.usrName = '';
    TestInfo.usrNameChkSum = 0;
    TestInfo.pn = 524286;
    if (TestInfo.acc == 0) {
        TestInfo.acc = "000";
    } else if (TestInfo.acc.length < 3) {
        TestInfo.acc = "0" + TestInfo.acc;
    } else if (TestInfo.acc.length > 3) {
        TestInfo.acc = TestInfo.acc.substring(0, 3);
    }
    if (TestInfo.testLength.length == 2)
        TestInfo.testLength = "0" + TestInfo.testLength;
    $("#timer").css("background-color", "red");
    $("#divCover").css("z-index", "400");
    $('#PRIW').show();
    UpdateResults();
    var twtrTwt = "https://twitter.com/home?status=Just took a free typing test online - I type " + TestInfo.WPM + " words per minute! How fast are you? - https://www.speedtypingonline.com";
    var shareURL = "https://www.speedtypingonline.com/myResults.php?r=" + encodeURIComponent(parseInt("1" + TestInfo.WPM + TestInfo.acc + TestInfo.testLength) * TestInfo.pn);
    generateGenLink();
    var newURL = "https://www.facebook.com/share.php?u=https://www.speedtypingonline.com/fbr.php?r=" + encodeURIComponent(getNetWPM() * 492368);
    $("#fbrLink").attr("href", newURL);
    $("#twtrLink").attr("href", twtrTwt);
    if ($("#resultDivContainer").is(":hidden")) {
        $("#resultDivContainer").slideDown('slow', function() {});
    }
    $('#centerConsole').addClass("expanded");
    $('#rightSkyAd').addClass("expanded");
    testCounter++;
}
function updateLoggedInInfo() {
    $.post('/getData.php', {
        type: "tt"
    }, function(output) {
        myJSONdata = $.parseJSON(output);
        var aveWPM = myJSONdata["averageWPM"];
        var aveAcc = myJSONdata["averageAcc"];
        var numTests = myJSONdata["numTTs"];
        var maxWPM = myJSONdata["maxWPM"];
        if (!myJSONdata["loggedInUsername"]) {
            $('#loginInfo').hide();
            $('#loginOrRegister').show();
        } else {
            $('#loginInfo').show();
            $('#loginOrRegister').hide();
            $('#aveWPM_data').html(aveWPM);
            $('#aveAcc_data').html(aveAcc + "%");
            $('#numTests_data').html(numTests);
            $('#maxWPM_data').html(maxWPM);
        }
    });
}
function generateGenLink() {
    var newUserName = $('#personName').val();
    if (newUserName != '' && newUserName != "<Name>") {
        userNameToAscii(newUserName);
    } else {
        TestInfo.usrName = '';
    }
    var shareURL = "https://www.speedtypingonline.com/myResults.php?r=" + encodeURIComponent(parseInt("1" + TestInfo.WPM + TestInfo.acc + TestInfo.testLength) * TestInfo.pn);
    shareURL += "&d=" + encodeURIComponent(TestInfo.endTS * TestInfo.pn);
    if (TestInfo.usrName != '') {
        shareURL += "&n=" + encodeURIComponent(TestInfo.usrName);
        shareURL += "&c=" + encodeURIComponent(TestInfo.usrNameChkSum * TestInfo.pn);
    }
    $('#genLink').attr("href", shareURL);
    $('#genLinkDisplay').attr("value", shareURL.substring(8));
    $('#genLinkEmail').attr("href", "mailto:example@domain.com?subject=" + encodeURIComponent("My Typing Test Results") + "&body=" + encodeURIComponent("Here is the link to my typing results:") + "%0D" + encodeURIComponent(shareURL));
}
function userNameToAscii(s) {
    var ascii = "";
    var sum = 0;
    if (s.length > 0)
        for (i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i).toString(16);
            while (c.length < 2)
                c = "0" + c;
            ascii += c;
            sum += parseInt(c, 16);
        }
    TestInfo.usrName = ascii;
    TestInfo.usrNameChkSum = sum;
}
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function CreateTimer_line(input, TimerID, Time) {
    keyInputTime = (new Date()).valueOf();
    var functionKeyPressed = true;
    var lineMiddle = (HALF_MAX_LINE_CHARS * 32) - 8;
    if (TotalSeconds == undefined || TimeWasReset) {
        cursor = 24;
        localCursor = 0;
        TimeWasReset = false;
        RoundTime = Time;
        Timer = document.getElementById(TimerID);
        TotalSeconds = Time;
        UpdateTimer()
        timeoutStart = (new Date).getTime();
        window.setTimeout("Tick()", 1000);
    }
    if (TimeWasReset) {
        TotalSeconds = Time;
        TimeWasReset = false;
    }
    if (TotalSeconds == 0) {
        return false;
    }
    var newRTEText = "";
    var RTELetter = lineDivText.substring(lineMiddle, lineMiddle + 1);
    var key_entered = input;
    if (typeof key_entered === "object") {
        if ($('#keyLayoutSelected').val().toUpperCase() == "DVORAK") {
            key_entered = d_keycode.d_getValueByEvent(input);
        } else if ($('#keyLayoutSelected').val().toUpperCase() == "QWERTY_UK") {
            key_entered = UK_QWERTY_keycode.UK_QWERTY_getValueByEvent(input);
        } else if ($('#keyLayoutSelected').val().toUpperCase() == "COLEMAK") {
            key_entered = cole_keycode.cole_getValueByEvent(input);
        } else if ($('#keyLayoutSelected').val().toUpperCase() == "AZERTY") {
            key_entered = AZERTY_keycode.AZERTY_getValueByEvent(input);
        } else if ($('#keyLayoutSelected').val().toUpperCase() == "QWERTZ") {
            key_entered = QWERTZ_keycode.QWERTZ_getValueByEvent(input);
        } else if ($('#keyLayoutSelected').val().toUpperCase() == "QWERTZ_SF") {
            key_entered = QWERTZ_SF_keycode.QWERTZ_SF_getValueByEvent(input);
        } else {
            key_entered = keycode.getValueByEvent(input);
        }
    }
    var functionKeyPressed = !(/^.$/.test(key_entered));
    if (!functionKeyPressed && responseTimeStart != 0) {
        if (savedResponseTimeStart != 0) {
            responseTimeStart = savedResponseTimeStart;
            savedResponseTimeStart = 0;
        }
        responseTime = keyInputTime - responseTimeStart;
        if (RTELetter in letterCounts) {
            letterCounts[RTELetter] = letterCounts[RTELetter] + 1;
            letterResponseTimes[RTELetter] = letterResponseTimes[RTELetter] + responseTime;
            if (RTELetter in letterMistakes) {
                letterPercentMisses[RTELetter] = Math.round((letterMistakes[RTELetter] / letterCounts[RTELetter]) * 100);
            }
        } else {
            letterCounts[RTELetter] = 1;
            letterResponseTimes[RTELetter] = responseTime;
        }
    } else if (functionKeyPressed && savedResponseTimeStart == 0) {
        savedResponseTimeStart = responseTimeStart;
    }
    if (key_entered == RTELetter) {
        functionKeyPressed = false;
        if (RTELetter == " ") {
            newRTEText = lineDivText.substring(32, lineMiddle - 11) + "goodSpace" + lineDivText.substring(lineMiddle - 2, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
            wordsTyped++;
        } else {
            newRTEText = lineDivText.substring(32, lineMiddle - 11) + "goodEntry" + lineDivText.substring(lineMiddle - 2, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
        }
        cursor += 32;
        lettersTypedCorrectly += 1;
        totalEntriesTyped += 1;
        if (phaseShift != 0) {
            phaseShift = 0;
        }
        if (localCursor < 20) {
            localCursor += 1;
        }
    } else if (!functionKeyPressed) {
        functionKeyPressed = false;
        if (phaseShift != 0) {
            if (phaseShift == 1) {
                if (key_entered == lineDivText.substring(lineMiddle + 32, lineMiddle + 33)) {
                    var shiftRight = true;
                }
            } else {
                var lastEntry;
                if (lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "bad_Entry" && badEntryChars.length > 0) {
                    lastEntry = badEntryChars[badEntryChars.length - 1];
                } else {
                    lastEntry = lineDivText.substring(lineMiddle - 32, lineMiddle - 31);
                }
                if (key_entered == lastEntry) {
                    var shiftLeft = true;
                }
            }
            phaseShift = 0;
        } else if (key_entered == lineDivText.substring(lineMiddle + 32, lineMiddle + 33)) {
            if ($('#psCheckbox').is(':checked')) {
                phaseShift = 1;
            }
        } else if (key_entered == lineDivText.substring(lineMiddle - 32, lineMiddle - 31)) {
            if ($('#psCheckbox').is(':checked')) {
                phaseShift = -1;
            }
        }
        if (shiftRight) {
            newRTEText = lineDivText.substring(64, lineMiddle - 11) + "phaseRght" + lineDivText.substring(lineMiddle - 2, lineMiddle + 21) + "goodEntry" + lineDivText.substring(lineMiddle + 30, lineMiddle + 53) + "nxtLetter" + lineDivText.substring(lineMiddle + 62) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>" + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 40) / 32) + 1, ((cursor + lineMiddle + 40) / 32) + 2) + "</span>";
            cursor += 32;
            lettersTypedIncorrectly -= 1;
            lettersTypedCorrectly += 1;
            shiftRight = false;
            if (localCursor < 20) {
                localCursor += 1;
            }
        } else if (shiftLeft) {
            newRTEText = lineDivText.substring(0, lineMiddle - 43) + "phaseLeft" + lineDivText.substring(lineMiddle - 34);
            cursor -= 32;
            lettersTypedIncorrectly -= 1;
            lettersTypedCorrectly += 1;
            shiftLeft = false;
            if (localCursor < 20) {
                localCursor += 1;
            }
        } else if (RTELetter == " ") {
            if ($('#colorHighlightingMode').val() == "NO_COLOR_HIGHLIGHTS") {
                badEntryChars.push(lineDivText.substring(lineMiddle, lineMiddle + 1));
                newRTEText = lineDivText.substring(32, lineMiddle - 11) + "bad_Space" + lineDivText.substring(lineMiddle - 2, lineMiddle) + key_entered + lineDivText.substring(lineMiddle + 1, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
            } else {
                newRTEText = lineDivText.substring(32, lineMiddle - 11) + "bad_Space" + lineDivText.substring(lineMiddle - 2, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
            }
            wordsTyped++;
        } else {
            if ($('#colorHighlightingMode').val() == "NO_COLOR_HIGHLIGHTS") {
                badEntryChars.push(lineDivText.substring(lineMiddle, lineMiddle + 1));
                newRTEText = lineDivText.substring(32, lineMiddle - 11) + "bad_Entry" + lineDivText.substring(lineMiddle - 2, lineMiddle) + key_entered + lineDivText.substring(lineMiddle + 1, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
            } else {
                newRTEText = lineDivText.substring(32, lineMiddle - 11) + "bad_Entry" + lineDivText.substring(lineMiddle - 2, lineMiddle + 21) + "nxtLetter" + lineDivText.substring(lineMiddle + 30) + '<span class="plainText">' + cleanTextString.substring(((cursor + lineMiddle + 8) / 32) + 1, ((cursor + lineMiddle + 8) / 32) + 2) + "</span>";
            }
            if (responseTime != 0) {
                if (RTELetter in letterMistakes) {
                    letterMistakes[RTELetter] = letterMistakes[RTELetter] + 1;
                } else {
                    letterMistakes[RTELetter] = 1;
                }
                letterPercentMisses[RTELetter] = Math.round((letterMistakes[RTELetter] / letterCounts[RTELetter]) * 100);
            }
        }
        cursor += 32;
        lettersTypedIncorrectly += 1;
        totalEntriesTyped += 1;
        if (localCursor < 20) {
            localCursor += 1;
        }
    } else if (key_entered == "backspace" && cursor > 24 && localCursor > 0) {
        functionKeyPressed = false;
        cursor -= 32;
        localCursor -= 1;
        if (lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "bad_Space") {
            wordsTyped--;
        }
        if (lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "goodSpace") {
            wordsTyped--;
        }
        if (lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "bad_Space" || lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "bad_Entry" || lineDivText.substring(lineMiddle - 43, lineMiddle - 34) == "phaseLeft") {
            badEntriesDeleted++;
            if (badEntryChars.length > 0) {
                var originalChar = badEntryChars.pop();
                lineDivText = lineDivText.substring(0, lineMiddle - 32) + originalChar + lineDivText.substring(lineMiddle - 31);
            }
        }
        if (cursor < lineMiddle) {
            newRTEText = '<span class="hiddenTxt"> </span>' + lineDivText.substring(0, lineMiddle - 43) + "nxtLetter" + lineDivText.substring(lineMiddle - 34, lineMiddle - 11) + "plainText" + lineDivText.substring(lineMiddle - 2, lineDivText.length - 32);
        } else {
            newRTEText = '<span class="hiddenTxt"> </span>' + lineDivText.substring(0, lineMiddle - 43) + "nxtLetter" + lineDivText.substring(lineMiddle - 34, lineMiddle - 11) + "plainText" + lineDivText.substring(lineMiddle - 2, lineDivText.length - 32);
        }
        deletes++;
    }
    if (!functionKeyPressed) {
        lineDivText = newRTEText;
        lineDiv.innerHTML = formatForInnerHTML(newRTEText);
    }
    responseTimeStart = (new Date()).valueOf();
    return false;
}
function formatForInnerHTML(StringToFormat) {
    var StringToReturn = "";
    StringToFormat = StringToFormat.replace(/> </g, ">&nbsp;<");
    StringToReturn = '<div id="line_input">' + StringToFormat + "</div>";
    return StringToReturn;
}
function formatForInnerHTML_block(StringToFormat) {
    var StringToReturn = "";
    for (i = 0; i < 4; i++) {
        StringToFormat[i] = StringToFormat[i].replace(/> </g, ">&nbsp;<");
        StringToReturn += '<div id="blockLine' + i + '" class="blockLines" unselectable="on" style="resize:none;">' + StringToFormat[i] + "</div>";
    }
    return StringToReturn;
}
function setupFocus() {
    $('.mainDivInputs').bind('click', function() {
        this.focus();
    });
    $('.mainDivInputs').bind('mouseleave', function() {
        this.focus();
    });
    $('.mainDivInputs').bind('mouseout', function() {
        this.focus();
    });
    $('.mainDivInputs').focus(function() {
        ApplyColorsFocused();
    });
    $('.mainDivInputs').blur(function() {
        ApplyColorsBlurred();
    });
}
keycode = {
    getKeyCode: function(e) {
        var keycode = null;
        if (window.event) {
            keycode = window.event.keyCode;
        } else if (e) {
            keycode = e.which;
        }
        return keycode;
    },
    getKeyCodeValue: function(keyCode, shiftKey, capsLock) {
        shiftKey = shiftKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.modifiedByShift[keyCode];
        } else {
            value = this.keyCodeMap[keyCode];
        }
        return value;
    },
    getValueByEvent: function(e) {
        return this.getKeyCodeValue(this.getKeyCode(e), e.shiftKey, (/^[A-Z]+$/.test(e.key)));
    },
    keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        173: "'",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "'",
        219: "[",
        220: "\\",
        221: "]",
        222: "'"
    },
    modifiedByShift: {
        32: " ",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        48: ")",
        49: "!",
        50: "@",
        51: "#",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        109: "_",
        61: "+",
        219: "{",
        221: "}",
        220: "|",
        59: ":",
        222: "\"",
        186: ":",
        187: "+",
        188: "<",
        189: "_",
        190: ">",
        191: "?"
    }
};
d_keycode = {
    d_getKeyCode: function(e) {
        var d_keycode = null;
        if (window.event) {
            d_keycode = window.event.keyCode;
        } else if (e) {
            d_keycode = e.which;
        }
        return d_keycode;
    },
    d_getKeyCodeValue: function(d_keyCode, shiftKey, capsLock) {
        shiftKey = shiftKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.d_modifiedByShift[d_keyCode];
        } else {
            value = this.d_keyCodeMap[d_keyCode];
        }
        return value;
    },
    d_getValueByEvent: function(e) {
        return this.d_getKeyCodeValue(this.d_getKeyCode(e), e.shiftKey, (/^[A-Z]+$/.test(e.key)));
    },
    d_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "}",
        44: "printscreen",
        45: "[",
        46: "delete",
        47: "z",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: "s",
        61: "]",
        65: "a",
        66: "x",
        67: "j",
        68: "e",
        69: ".",
        70: "u",
        71: "i",
        72: "d",
        73: "c",
        74: "h",
        75: "t",
        76: "n",
        77: "m",
        78: "b",
        79: "r",
        80: "l",
        81: "'",
        82: "p",
        83: "o",
        84: "y",
        85: "g",
        86: "k",
        87: ",",
        88: "q",
        89: "f",
        90: ";",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "}",
        109: "[",
        110: "v",
        111: "z",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        186: "s",
        187: "]",
        188: "w",
        189: "[",
        190: "v",
        191: "z",
        192: "`",
        219: "/",
        220: "\\",
        221: "=",
        222: "-"
    },
    d_modifiedByShift: {
        32: " ",
        65: "A",
        66: "X",
        67: "J",
        68: "E",
        69: ">",
        70: "U",
        71: "I",
        72: "D",
        73: "C",
        74: "H",
        75: "T",
        76: "N",
        77: "M",
        78: "B",
        79: "R",
        80: "L",
        81: "\"",
        82: "P",
        83: "O",
        84: "Y",
        85: "G",
        86: "K",
        87: "<",
        88: "Q",
        89: "F",
        90: ":",
        192: "~",
        48: ")",
        49: "!",
        50: "@",
        51: "#",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        109: "{",
        61: "}",
        219: "?",
        221: "+",
        220: "|",
        59: "S",
        222: "_",
        186: "S",
        187: "}",
        188: "W",
        189: "{",
        190: "V",
        191: "Z"
    }
};
cole_keycode = {
    cole_getKeyCode: function(e) {
        var cole_keycode = null;
        if (window.event) {
            cole_keycode = window.event.keyCode;
        } else if (e) {
            cole_keycode = e.which;
        }
        return cole_keycode;
    },
    cole_getKeyCodeValue: function(cole_keyCode, shiftKey, capsLock) {
        shiftKey = shiftKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.cole_modifiedByShift[cole_keyCode];
        } else {
            value = this.cole_keyCodeMap[cole_keyCode];
        }
        return value;
    },
    cole_getValueByEvent: function(e) {
        return this.cole_getKeyCodeValue(this.cole_getKeyCode(e), e.shiftKey, (/^[A-Z]+$/.test(e.key)));
    },
    cole_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "backspace",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: "o",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "s",
        69: "f",
        70: "t",
        71: "d",
        72: "h",
        73: "u",
        74: "n",
        75: "e",
        76: "i",
        77: "m",
        78: "k",
        79: "y",
        80: ";",
        81: "q",
        82: "p",
        83: "r",
        84: "g",
        85: "l",
        86: "v",
        87: "w",
        88: "x",
        89: "j",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        173: "'",
        186: "o",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'"
    },
    cole_modifiedByShift: {
        32: " ",
        59: "O",
        65: "A",
        66: "B",
        67: "C",
        68: "S",
        69: "F",
        70: "T",
        71: "D",
        72: "H",
        73: "U",
        74: "N",
        75: "E",
        76: "I",
        77: "M",
        78: "K",
        79: "Y",
        80: ";",
        81: "Q",
        82: "P",
        83: "R",
        84: "G",
        85: "L",
        86: "V",
        87: "W",
        88: "X",
        89: "J",
        90: "Z",
        192: "~",
        48: ")",
        49: "!",
        50: "@",
        51: "#",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        109: "_",
        61: "+",
        219: "{",
        221: "}",
        220: "|",
        222: "\"",
        186: "O",
        187: "+",
        188: "<",
        189: "_",
        190: ">",
        191: "?"
    }
};
UK_QWERTY_keycode = {
    UK_QWERTY_getKeyCode: function(e) {
        var UK_QWERTY_keycode = null;
        if (window.event) {
            UK_QWERTY_keycode = window.event.keyCode;
        } else if (e) {
            UK_QWERTY_keycode = e.which;
        }
        return UK_QWERTY_keycode;
    },
    UK_QWERTY_getKeyCodeValue: function(UK_QWERTY_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.UK_QWERTY_modifiedByShift[UK_QWERTY_keyCode];
        } else if (altKey === true) {
            value = this.UK_QWERTY_modifiedByAltGr[UK_QWERTY_keyCode];
        } else {
            value = this.UK_QWERTY_keyCodeMap[UK_QWERTY_keyCode];
        }
        return value;
    },
    UK_QWERTY_MOZILLA_getKeyCodeValue: function(UK_QWERTY_MOZILLA_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.UK_QWERTY_MOZILLA_modifiedByShift[UK_QWERTY_MOZILLA_keyCode];
        } else if (altKey === true) {
            value = this.UK_QWERTY_modifiedByAltGr[UK_QWERTY_MOZILLA_keyCode];
        } else {
            value = this.UK_QWERTY_MOZILLA_keyCodeMap[UK_QWERTY_MOZILLA_keyCode];
        }
        return value;
    },
    UK_QWERTY_getValueByEvent: function(e) {
        if (!$.browser.mozilla)
            return this.UK_QWERTY_getKeyCodeValue(this.UK_QWERTY_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
        return this.UK_QWERTY_MOZILLA_getKeyCodeValue(this.UK_QWERTY_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
    },
    UK_QWERTY_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "'",
        219: "[",
        220: "\\",
        221: "]",
        222: "#",
        223: "`"
    },
    UK_QWERTY_modifiedByShift: {
        32: " ",
        50: "\"",
        51: "£",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        48: ")",
        49: "!",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: ":",
        187: "+",
        188: "<",
        189: "_",
        190: ">",
        191: "?",
        192: "@",
        219: "{",
        221: "}",
        220: "|",
        222: "~",
        223: "¬"
    },
    UK_QWERTY_MOZILLA_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'",
        223: "`"
    },
    UK_QWERTY_MOZILLA_modifiedByShift: {
        32: " ",
        50: "\"",
        51: "£",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        48: ")",
        49: "!",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: ":",
        187: "+",
        188: "<",
        189: "_",
        190: ">",
        191: "?",
        192: "¬",
        219: "{",
        221: "}",
        220: "|",
        222: "@",
        223: "¬"
    },
    UK_QWERTY_modifiedByAltGr: {
        52: "€",
        65: "á",
        69: "é",
        73: "í",
        79: "ó",
        85: "ú",
        192: "¦",
        223: "¦"
    }
};
AZERTY_keycode = {
    AZERTY_getKeyCode: function(e) {
        var AZERTY_keycode = null;
        if (window.event) {
            AZERTY_keycode = window.event.keyCode;
        } else if (e) {
            AZERTY_keycode = e.which;
        }
        return AZERTY_keycode;
    },
    AZERTY_getKeyCodeValue: function(AZERTY_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.AZERTY_modifiedByShift[AZERTY_keyCode];
        } else if (altKey === true) {
            value = this.AZERTY_modifiedByAltGr[AZERTY_keyCode];
        } else {
            value = this.AZERTY_keyCodeMap[AZERTY_keyCode];
        }
        return value;
    },
    AZERTY_MOZILLA_getKeyCodeValue: function(AZERTY_MOZILLA_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.AZERTY_MOZILLA_modifiedByShift[AZERTY_MOZILLA_keyCode];
        } else if (altKey === true) {
            value = this.AZERTY_modifiedByAltGr[AZERTY_MOZILLA_keyCode];
        } else {
            value = this.AZERTY_MOZILLA_keyCodeMap[AZERTY_MOZILLA_keyCode];
        }
        return value;
    },
    AZERTY_getValueByEvent: function(e) {
        if (!$.browser.mozilla)
            return this.AZERTY_getKeyCodeValue(this.AZERTY_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
        return this.AZERTY_MOZILLA_getKeyCodeValue(this.AZERTY_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
    },
    AZERTY_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "à",
        49: "&",
        50: "é",
        51: "\"",
        52: "'",
        53: "(",
        54: "-",
        55: "è",
        56: "_",
        57: "ç",
        59: ";",
        61: "=",
        65: "q",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: ",",
        78: "n",
        79: "o",
        80: "p",
        81: "a",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "z",
        88: "x",
        89: "y",
        90: "w",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "^",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: "m",
        187: "=",
        188: ";",
        189: ")",
        190: ":",
        191: "!",
        192: "²",
        219: "^",
        220: "*",
        221: "$",
        222: "ù",
        223: "!"
    },
    AZERTY_modifiedByShift: {
        32: " ",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        65: "Q",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "?",
        78: "N",
        79: "O",
        80: "P",
        81: "A",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "Z",
        88: "X",
        89: "Y",
        90: "W",
        192: "~",
        109: "_",
        163: "~",
        173: "_",
        186: "M",
        187: "+",
        188: ".",
        189: "°",
        190: "/",
        191: "§",
        192: "%",
        219: "¨",
        221: "£",
        220: "µ",
        222: "%",
        223: "§"
    },
    AZERTY_MOZILLA_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "à",
        49: "&",
        50: "é",
        51: "\"",
        52: "'",
        53: "(",
        54: "-",
        55: "è",
        56: "_",
        57: "ç",
        59: "m",
        61: "=",
        65: "q",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: ",",
        78: "n",
        79: "o",
        80: "p",
        81: "a",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "z",
        88: "x",
        89: "y",
        90: "w",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "^",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        169: ")",
        173: ")",
        186: "m",
        187: "=",
        188: ";",
        189: ")",
        190: ":",
        191: "!",
        192: "²",
        219: "^",
        220: "*",
        221: "$",
        222: "ù",
        223: "!"
    },
    AZERTY_MOZILLA_modifiedByShift: {
        32: " ",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: "M",
        61: "+",
        65: "Q",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "?",
        78: "N",
        79: "O",
        80: "P",
        81: "A",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "Z",
        88: "X",
        89: "Y",
        90: "W",
        192: "~",
        163: "~",
        173: "°",
        186: "M",
        187: "+",
        188: ".",
        190: "/",
        191: "§",
        192: "%",
        219: "¨",
        221: "£",
        220: "µ",
        222: "%",
        223: "§"
    },
    AZERTY_modifiedByAltGr: {
        52: "€",
        65: "á",
        69: "é",
        73: "í",
        79: "ó",
        85: "ú",
        192: "¦",
        223: "¦"
    }
};
QWERTZ_keycode = {
    QWERTZ_getKeyCode: function(e) {
        var QWERTZ_keycode = null;
        if (window.event) {
            QWERTZ_keycode = window.event.keyCode;
        } else if (e) {
            QWERTZ_keycode = e.which;
        }
        return QWERTZ_keycode;
    },
    QWERTZ_getKeyCodeValue: function(QWERTZ_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.QWERTZ_modifiedByShift[QWERTZ_keyCode];
        } else if (altKey === true) {
            value = this.QWERTZ_modifiedByAltGr[QWERTZ_keyCode];
        } else {
            value = this.QWERTZ_keyCodeMap[QWERTZ_keyCode];
        }
        return value;
    },
    QWERTZ_MOZILLA_getKeyCodeValue: function(QWERTZ_MOZILLA_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.QWERTZ_MOZILLA_modifiedByShift[QWERTZ_MOZILLA_keyCode];
        } else if (altKey === true) {
            value = this.QWERTZ_modifiedByAltGr[QWERTZ_MOZILLA_keyCode];
        } else {
            value = this.QWERTZ_MOZILLA_keyCodeMap[QWERTZ_MOZILLA_keyCode];
        }
        return value;
    },
    QWERTZ_getValueByEvent: function(e) {
        if (!$.browser.mozilla)
            return this.QWERTZ_getKeyCodeValue(this.QWERTZ_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
        return this.QWERTZ_MOZILLA_getKeyCodeValue(this.QWERTZ_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
    },
    QWERTZ_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "z",
        90: "y",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: "ö",
        187: "´",
        188: ",",
        189: "ß",
        190: ".",
        191: "-",
        192: "^",
        219: "ü",
        220: "#",
        221: "+",
        222: "ä",
        223: "`"
    },
    QWERTZ_modifiedByShift: {
        32: " ",
        50: "\"",
        51: "£",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Z",
        90: "Y",
        192: "~",
        48: "=",
        49: "!",
        51: "§",
        52: "$",
        53: "%",
        54: "&",
        55: "/",
        56: "(",
        57: ")",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: "Ö",
        187: "`",
        188: ";",
        189: "?",
        190: ":",
        191: "_",
        192: "°",
        219: "Ü",
        220: "'",
        221: "*",
        222: "Ä",
        223: "¬"
    },
    QWERTZ_MOZILLA_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'",
        223: "`"
    },
    QWERTZ_MOZILLA_modifiedByShift: {
        32: " ",
        50: "\"",
        51: "£",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        48: ")",
        49: "!",
        52: "$",
        53: "%",
        54: "^",
        55: "&",
        56: "*",
        57: "(",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: ":",
        187: "+",
        188: "<",
        189: "_",
        190: ">",
        191: "?",
        192: "¬",
        219: "{",
        221: "}",
        220: "|",
        222: "@",
        223: "¬"
    },
    QWERTZ_modifiedByAltGr: {
        48: "}",
        50: "²",
        51: "³",
        55: "{",
        56: "[",
        57: "]",
        65: "á",
        69: "€",
        73: "í",
        77: "µ",
        81: "@",
        189: "\\",
        192: "¦",
        221: "~"
    }
};
QWERTZ_SF_keycode = {
    QWERTZ_SF_getKeyCode: function(e) {
        var QWERTZ_SF_keycode = null;
        if (window.event) {
            QWERTZ_SF_keycode = window.event.keyCode;
        } else if (e) {
            QWERTZ_SF_keycode = e.which;
        }
        return QWERTZ_SF_keycode;
    },
    QWERTZ_SF_getKeyCodeValue: function(QWERTZ_SF_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.QWERTZ_SF_modifiedByShift[QWERTZ_SF_keyCode];
        } else if (altKey === true) {
            value = this.QWERTZ_SF_modifiedByAltGr[QWERTZ_SF_keyCode];
        } else {
            value = this.QWERTZ_SF_keyCodeMap[QWERTZ_SF_keyCode];
        }
        return value;
    },
    QWERTZ_SF_MOZILLA_getKeyCodeValue: function(QWERTZ_SF_MOZILLA_keyCode, shiftKey, altKey, capsLock) {
        shiftKey = shiftKey || false;
        altKey = altKey || false;
        var value = null;
        if (shiftKey === true || capsLock === true) {
            value = this.QWERTZ_SF_MOZILLA_modifiedByShift[QWERTZ_SF_MOZILLA_keyCode];
        } else if (altKey === true) {
            value = this.QWERTZ_SF_modifiedByAltGr[QWERTZ_SF_MOZILLA_keyCode];
        } else {
            value = this.QWERTZ_SF_MOZILLA_keyCodeMap[QWERTZ_SF_MOZILLA_keyCode];
        }
        return value;
    },
    QWERTZ_SF_getValueByEvent: function(e) {
        if (!$.browser.mozilla)
            return this.QWERTZ_SF_getKeyCodeValue(this.QWERTZ_SF_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
        return this.QWERTZ_SF_MOZILLA_getKeyCodeValue(this.QWERTZ_SF_getKeyCode(e), e.shiftKey, e.altKey, (/^[A-Z]+$/.test(e.key)));
    },
    QWERTZ_SF_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: "è",
        187: "´",
        188: ",",
        189: "-",
        190: ".",
        191: "-",
        192: "¨",
        219: "'",
        220: "à",
        221: "^",
        222: "é",
        223: "$"
    },
    QWERTZ_SF_modifiedByShift: {
        32: " ",
        48: "=",
        49: "+",
        50: "\"",
        51: "*",
        52: "ç",
        53: "%",
        54: "&",
        55: "/",
        56: "(",
        57: ")",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: "ü",
        187: "`",
        188: ";",
        189: "_",
        190: ":",
        191: "_",
        192: "!",
        219: "?",
        220: "ä",
        221: "`",
        222: "ö",
        223: "£"
    },
    QWERTZ_SF_MOZILLA_keyCodeMap: {
        8: "backspace",
        9: "tab",
        13: "↵",
        16: "shift",
        17: "ctrl",
        18: "alt",
        19: "pausebreak",
        20: "capslock",
        27: "escape",
        32: " ",
        33: "pageup",
        34: "pagedown",
        35: "end",
        36: "home",
        37: "left",
        38: "up",
        39: "right",
        40: "down",
        42: "*",
        43: "+",
        44: "printscreen",
        45: "-",
        46: "delete",
        47: "/",
        48: "0",
        49: "1",
        50: "2",
        51: "3",
        52: "4",
        53: "5",
        54: "6",
        55: "7",
        56: "8",
        57: "9",
        59: ";",
        61: "=",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
        96: "0",
        97: "1",
        98: "2",
        99: "3",
        100: "4",
        101: "5",
        102: "6",
        103: "7",
        104: "8",
        105: "9",
        106: "*",
        107: "+",
        109: "-",
        110: ".",
        111: "/",
        112: "f1",
        113: "f2",
        114: "f3",
        115: "f4",
        116: "f5",
        117: "f6",
        118: "f7",
        119: "f8",
        120: "f9",
        121: "f10",
        122: "f11",
        123: "f12",
        144: "numlock",
        145: "scrolllock",
        163: "#",
        173: "-",
        186: "è",
        187: "´",
        188: ",",
        189: "-",
        190: ".",
        191: "-",
        192: "¨",
        219: "'",
        220: "à",
        221: "^",
        222: "é",
        223: "$"
    },
    QWERTZ_SF_MOZILLA_modifiedByShift: {
        32: " ",
        48: "=",
        49: "+",
        50: "\"",
        51: "*",
        52: "ç",
        53: "%",
        54: "&",
        55: "/",
        56: "(",
        57: ")",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
        192: "~",
        59: ":",
        61: "+",
        109: "_",
        163: "~",
        173: "_",
        186: "ü",
        187: "`",
        188: ";",
        189: "_",
        190: ":",
        191: "_",
        192: "!",
        219: "?",
        220: "ä",
        221: "`",
        222: "ö",
        223: "£"
    },
    QWERTZ_SF_modifiedByAltGr: {
        48: "}",
        49: "¦",
        50: "@",
        51: "#",
        52: "°",
        53: "§",
        54: "¬",
        55: "|",
        56: "¢",
        57: "]",
        65: "á",
        69: "€",
        73: "í",
        77: "µ",
        81: "@",
        186: "[",
        187: "~",
        189: "´",
        192: "]",
        219: "[",
        220: "}",
        221: "]",
        222: "{",
        223: "}"
    }
};
function getPComplete() {
    var a;
    a = (lettersTypedCorrectly + lettersTypedIncorrectly - totalDeletes + pShiftWeight) / (textString.length - 1) * 100;
    a = Math.floor(a);
    return a
}
function getNumFixedMistakes() {
    var a = 0;
    if (lettersTypedCorrectly >= badEntriesDeleted) {
        a = badEntriesDeleted
    } else {
        a = badEntriesDeleted - (badEntriesDeleted - lettersTypedCorrectly)
    }
    return a
}
function getTimeInMins() {
    timeInSecs = getTimeElapsed();
    timeInMins = timeInSecs / 60;
    timeInMins *= 10;
    timeInMins = Math.round(timeInMins);
    timeInMins /= 10;
    return timeInMins
}
function getAccuracy() {
    var a = 100;
    var b = lettersTypedCorrectly + lettersTypedIncorrectly - badEntriesDeleted + getNumFixedMistakes();
    if (getTimeElapsed() != 0) {
        a = lettersTypedCorrectly / b * 100;
        a *= 10;
        a = Math.round(a);
        a /= 10;
        if (b == 0) {
            a = 100
        }
        if (a < 0) {
            a = 0
        }
    }
    return a
}
function getGrossWPM() {
    var a = 0;
    var b = lettersTypedCorrectly + lettersTypedIncorrectly;
    if (getTimeElapsed() != 0) {
        a = b / getTimeElapsed();
        a *= 12;
        if (a == "Infinity" || a < 0) {
            a = 0
        }
        a = Math.round(a)
    }
    return a
}
function getNetWPM() {
    var a = 0;
    var b = lettersTypedCorrectly + lettersTypedIncorrectly;
    if (getTimeElapsed() != 0) {
        a = b / getTimeElapsed();
        a *= 12;
        a = a - getEPM();
        if (a == "Infinity" || a < 0) {
            a = 0
        }
        a = Math.round(a)
    }
    return a
}
function getEPM() {
    return Math.round((lettersTypedIncorrectly - getNumFixedMistakes()) / getTimeElapsed() * 60)
}
function getTimeElapsed() {
    if (typeof Timer == "undefined") {
        return TotalSeconds
    }
    return RoundTime - TotalSeconds
}
function getSortedArray(arr, num, order) {
    sortable = [];
    for (var p in arr) {
        if (arr.hasOwnProperty(p)) {
            if (p == " ") {
                p_text = "<span style=\"border: 1px solid#1C1B1B;letter-spacing: 6px;display:inline-block;line-height:25px;\">&nbsp;</span>";
            } else {
                p_text = p;
            }
            sortable.push([p_text, arr[p]]);
        }
    }
    if (typeof order == "undefined" || order == "DESC") {
        sortable.sort(function(a, b) {
            return b[1] - a[1];
        });
    } else {
        sortable.sort(function(a, b) {
            return a[1] - b[1];
        });
    }
    return sortable.slice(0, num);
}
function getKPM() {
    return Math.round((lettersTypedCorrectly + lettersTypedIncorrectly) / getTimeElapsed() * 60)
}
function UpdateResults() {
    testCounter++;
    var a = $("#WPM_Result").get();
    var b = getNetWPM();
    var c = getAccuracy();
    var d = lettersTypedCorrectly + lettersTypedIncorrectly;
    var e = getNumFixedMistakes();
    var f = getEPM();
    var g = getKPM();
    var h = getTimeElapsed();
    var k = getSortedArray(letterMistakes, 3);
    var m = getSortedArray(letterPercentMisses, 3);
    var p = JSON.stringify(letterMistakes);
    var q = JSON.stringify(letterCounts);
    var r = JSON.stringify(letterResponseTimes);
    var u = TestInfo.textInd;
    var v = TestInfo.textType;
    var letterSpeeds = {};
    for (var ee in letterResponseTimes) {
        letterSpeeds[ee] = Math.round(1 / (((letterResponseTimes[ee] / letterCounts[ee]) * 5) / 60000));
    }
    var s = getSortedArray(letterSpeeds, 3, "ASC");
    var t = getSortedArray(letterSpeeds, 3);
    var kl = keyboardArr.indexOf($('#keyLayoutSelected').val());
    $.post('setData.php', {
        type: "tt",
        keyboard: kl,
        wpm: b,
        accuracy: c,
        total_entries: d,
        incorrect_entries: lettersTypedIncorrectly,
        fixed_mistakes: e,
        total_time_secs: h,
        letter_mistakes: p,
        letter_counts: q,
        response_times: r,
        text_ind: u,
        text_type: v,
        the_sa_id: sa_id
    }, function(output) {
        var myTest = 'Test';
        myTest += 'ing';
    });
    a[0].innerHTML = b + "<span> WPM</span>";
    a = $("#rWPM_Result").get();
    a[0].innerHTML = getGrossWPM() + "<span> WPM</span>";
    a = $("#Accur_Result").get();
    a[0].innerHTML = c + "<span> %</span>";
    a = $("#TLT_Result").get();
    a[0].innerHTML = d;
    a = $("#LTC_Result").get();
    a[0].innerHTML = lettersTypedCorrectly;
    a = $("#nLTI_Result").get();
    a[0].innerHTML = lettersTypedIncorrectly;
    a = $("#CL_Result").get();
    a[0].innerHTML = e;
    a = $("#ER_Result").get();
    a[0].innerHTML = f;
    a = $("#KPM_Result").get();
    a[0].innerHTML = g + "<span> KPM</span>";
    a = $("#words_Result").get();
    a[0].innerHTML = wordsTyped;
    a = $("#LetMissed_Result").get();
    a[0].innerHTML = (k != '') ? k.map(function(elem) {
        return "<div><span class=\"typeLetter bold\">" + elem[0] + "</span> (" + elem[1] + " misses)</div>";
    }).join('') : "None";
    a = $("#LetPercent_Result").get();
    a[0].innerHTML = (m != '') ? m.map(function(elem) {
        return "<div><span class=\"typeLetter bold\">" + elem[0] + "</span> (" + elem[1] + "% missed)</div>";
    }).join('') : "&nbsp;&nbsp;No mistakes!";
    a = $("#slowLetters_Result").get();
    a[0].innerHTML = (s != '') ? s.map(function(elem) {
        return "<div><span class=\"typeLetter bold\">" + elem[0] + "</span> (" + elem[1] + " wpm)</div>";
    }).join('') : "&nbsp;&nbsp;None";
    a = $("#fastLetters_Result").get();
    a[0].innerHTML = (t != '') ? t.map(function(elem) {
        return "<div><span class=\"typeLetter bold\">" + elem[0] + "</span> (" + elem[1] + " wpm)</div>";
    }).join('') : "&nbsp;&nbsp;None";
    a = $("#time_Result").get();
    a[0].innerHTML = h + "<span> min</span>"
    if (h < 60) {
        $("#time_Result").html(h + ' secs');
    } else {
        $("#time_Result").html(Math.round(h / 60) + ' min(s)');
    }
}
function UpdateStats() {
    var a = $("#wpmValue").get();
    if (a.length != 0) {
        a[0].innerHTML = getNetWPM()
    }
    var b = $("#accuracyValue").get();
    if (b.length != 0) {
        b[0].innerHTML = getAccuracy() + "<span> %</span>"
    }
    var c = $("#pCompleteValue").get();
    if (c.length != 0 && (lettersTypedCorrectly + lettersTypedIncorrectly - totalDeletes + pShiftWeight == textString.length - 1 || TotalSeconds % 2 == 0)) {
        c[0].innerHTML = getPComplete() + "<span> %</span>"
    }
}
function GetText() {
    var e = $("#textTypeSelected").val().toUpperCase();
    $.post('/getData.php', {
        type: "ttt",
        textType: e
    }, function(output) {
        myJSONdata = $.parseJSON(output);
        tttArr = myJSONdata["textToType"];
        if (myJSONdata["maint_mode"]) {
            $.getJSON('/resources/STO_ttt.json', function(data) {
                tttArr = data;
                processTTT(tttArr, e);
            });
        } else {
            processTTT(tttArr, e);
            if (textSelectionFromQueryString != '') {
                $('#titleTypeSelected').val(textSelectionFromQueryString).change();
                textSelectionFromQueryString = '';
            }
        }
    });
}
function processTTT(tttArr, textType) {
    TestInfo.textInd = 0;
    if ((typeof tttArr != "undefined") && (tttArr.length > 0)) {
        var f_elem = $("#titleTypeSelected");
        var f = f_elem.val();
        if (textType != "CUSTOM") {
            f_elem.empty();
            var appendText = '<option value="0">Random</option>';
            for (var ii = 0; ii < tttArr.length; ii++) {
                appendText += '<option id="' + ii + '" value="' + tttArr[ii].id + '">' + tttArr[ii].title + '</option>';
            }
            f_elem.append(appendText);
            f_elem.val(f);
            var f_test = f_elem.val();
            if (f_test == "0") {
                f = 0;
            }
            if (f != 0) {
                textIndex = $("#titleTypeSelected option:selected")[0].id;
            } else {
                var defaultVal = f_elem.attr("data-default");
                if (defaultVal != undefined && defaultVal != "done" && defaultVal != 0) {
                    f_elem.attr("data-default", "done");
                    var defaultElem = $('#titleTypeSelected option[value=' + defaultVal + ']');
                    defaultElem.prop('selected', true);
                    textIndex = defaultElem.attr("id");
                    if (textIndex == undefined) {
                        textIndex = Math.floor(Math.random() * tttArr.length);
                    }
                } else {
                    textIndex = Math.floor(Math.random() * tttArr.length);
                    var lcv = 0;
                    while (textType == "ENTRY" && (tttArr[textIndex].type == "DATA_ENTRY" || tttArr[textIndex].type == "NUMPAD") && lcv < 20) {
                        textIndex = Math.floor(Math.random() * tttArr.length);
                        lcv++;
                    }
                }
            }
        } else {
            textIndex = 0;
            var ctiElem = $("#customTextInput");
            var customText = ctiElem.val();
            if (customText == "") {
                ctiElem.val(tttArr[textIndex].text);
            } else {
                tttArr[textIndex].text = customText;
            }
            a = "http://www.speedtypingonline.com/typing-test?cText=" + encodeURIComponent(customText.replace(/[\n\r]/g, ' '));
            $("#CT_saveA").attr("href", a);
            $("#CT_saveInput").val(a);
        }
        t = tttArr[textIndex].display_text;
        n = tttArr[textIndex].title;
        r = tttArr[textIndex].author;
        TestInfo.textInd = tttArr[textIndex].id;
        if (textType == "DATA_ENTRY" || tttArr[textIndex].type == "DATA_ENTRY") {
            if (tttArr[textIndex].title.indexOf("Basic") !== -1) {
                textString = generateEntryData(5e4, 3);
            } else {
                textString = generateEntryData(5e4);
            }
        } else if (textType == "NUMPAD" || tttArr[textIndex].type == "NUMPAD") {
            textString = generateNumpadText(5e4, parseInt(textIndex));
        } else {
            textString = tttArr[textIndex].text;
        }
        if (tttArr[textIndex].randomize_char != null) {
            u = tttArr[textIndex].text.split(tttArr[textIndex].randomize_char);
            textString = "";
            while (textString.length < 5e4) {
                textString += u[Math.floor(Math.random() * u.length)] + " ";
            }
        } else {
            var space = " ";
            while (textString.length < 5e4) {
                if (textType == "CUSTOM")
                    space = "";
                textString += space + textString;
            }
        }
        if (textType != "CUSTOM") {
            textString = textString.replace(/&/g, "&");
            textString = textString.replace(/</g, "<");
            textString = textString.replace(/>/g, "<");
            textString = textString.replace(/  /g, " ");
        }
        if ($("#dsCheckbox").is(":checked")) {
            textString = textString.replace(/[.] /g, ".  ");
            textString = textString.replace(/[?] /g, "?  ");
            textString = textString.replace(/[!] /g, "!  ")
        }
    } else {
        textString = "Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs. The quick brown fox jumps over a lazy dog. Every good cow, fox, squirrel, and zebra likes to jump over happy dogs. Just keep examining every low bid quoted for zinc etchings. A quick movement of the enemy will jeopardize six gunboats. Few black taxis drive up major roads on quiet hazy nights. Big July earthquakes confound zany experimental vow. Grumpy wizards make a toxic brew for the jovial queen. My girl wove six dozen plaid jackets before she quit. Painful zombies quickly watch a jinxed graveyard. The lazy major was fixing Cupid's broken quiver. The quick onyx goblin jumps over the lazy dwarf. Twelve ziggurats quickly jumped a finch box. My faxed joke won a pager in the cable TV quiz show. Woven silk pyjamas exchanged for blue quartz. We promptly judged antique ivory buckles for the next prize. How razorback jumping frogs can level six piqued gymnasts. Sixty zippers were quickly picked from the woven jute bag. The exodus of jazzy pigeons is craved by squeamish walkers. All questions asked by five watch experts amazed the judge. A quick movement of the enemy will jeopardize six gunboats. West quickly gave Bert handsome prizes for six juicy plums. Jeb quickly drove a few extra miles on the glazed pavement";
        var n = "Default";
        var r = "Default";
        var t = "Pangrams";
    }
    setupTextToType(textString, t, n, r);
}
function setupTextToType(textString, t, n, r) {
    $("#textTypeDisplay").html(t);
    $("#textTitleDisplay").html(n);
    $("#textAuthorDisplay").html(r);
    var tempStr = "";
    var tempBlockDivStr = ["", "", "", ""];
    var localCutoff = 0;
    minCursorReplaceStart = 0;
    for (var i = 0; i < 4; i++) {
        tempStr = textString.substring(cutoff, (MAX_CHARS_IN_LINE * (i + 1)) - ((MAX_CHARS_IN_LINE * i) - cutoff));
        localCutoff = tempStr.search(/(\r\n|\n|\r|↵)/);
        if (localCutoff < 1) {
            localCutoff = tempStr.lastIndexOf(" ") + 1;
            if (localCutoff == 0) {
                localCutoff = MAX_CHARS_IN_LINE;
            }
            for (j = 0; j < localCutoff; j++) {
                blockDivText[i] += '<span class="plainText">' + tempStr.substring(j, j + 1) + '</span>';
            }
            cutoff += localCutoff;
        } else {
            var tempStr2 = tempStr.substring(0, localCutoff + 1);
            if (tempStr2.search(/(↵)/) < 1)
                tempStr2 = tempStr2.replace(/(\r\n|\n|\r|\s\r\n|\s\n|\s\r)/, " ");
            for (var j = 0; j < tempStr2.length; j++) {
                blockDivText[i] += '<span class="plainText">' + tempStr2.substring(j, j + 1) + '</span>';
            }
            cutoff += localCutoff + 1;
        }
        if (i <= 0) {
            minCursorReplaceStart += localCutoff + 2;
        }
    }
    blockDivText[0] = blockDivText[0].replace(/plainText/i, "nxtLetter");
    tempBlockDivStr[0] = blockDivText[0];
    tempBlockDivStr[1] = blockDivText[1];
    tempBlockDivStr[2] = blockDivText[2];
    tempBlockDivStr[3] = blockDivText[3];
    cleanTextString = textString.replace(/\s\n|\n\s|\n/gm, " ");
    tempStr = "";
    var spaceFound = textString.indexOf(" ", 141);
    if (spaceFound < 0)
        spaceFound = 141;
    tempStr += '<span class="nxtLetter">' + cleanTextString.substring(0, 1) + '</span>';
    for (i = 1; i <= spaceFound; i++) {
        tempStr += '<span class="plainText">' + cleanTextString.substring(i, i + 1) + '</span>';
    }
    lineDivText = '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + '<span class="hiddenTxt"> </span>' + tempStr.substring(0, (32 * (HALF_MAX_LINE_CHARS + 1)));
    blockDiv = $('#blockDivContainer').get();
    blockDiv = blockDiv[0];
    lineDiv = $('#lineDivContainer').get();
    lineDiv = lineDiv[0];
    blockDiv.innerHTML = formatForInnerHTML_block(tempBlockDivStr);
    lineDiv.innerHTML = formatForInnerHTML(lineDivText);
    setupFocus();
    if ($.browser.msie && $.browser.version <= 6) {
        $("div.blockLines").css("font-size", "25px");
        $("#line_input").css("font-size", "25px");
    }
    responseTimeStart = 0;
    gettingText = false;
}
function generateEntryData(length, difficulty) {
    var returnStr = '';
    if (typeof difficulty === 'undefined') {
        difficulty = 7;
    }
    var dataType;
    var firstNames = new Array(4);
    var lastNames = new Array(4);
    firstNames[0] = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Chris", "Daniel", "Matthew", "Jacob", "Josh", "Andrew", "Ethan", "Aiden", "Liam", "Noah", "Mary", "Patricia", "Jennifer", "Elizabeth", "Linda", "Barbara", "Susan", "Jessica", "Emily", "Madison", "Emma", "Olivia", "Abigail", "Isabella", "Ava", "Aaliyah"];
    lastNames[0] = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Martin", "Jackson", "Robinson"];
    firstNames[1] = ["Aarav", "Reyansh", "Mohammad", "Muhammad", "Vivaan", "Ayaan", "Ahmed", "Aadya", "Diya", "Saanvi", "Amaira", "Anya"];
    lastNames[1] = ["Devi", "Singh", "Kumar", "Das", "Kaur", "Ram", "Yadav", "Khan", "Patel"];
    firstNames[2] = ["Wei", "Jie", "Hao", "Yi", "Jun"];
    lastNames[2] = ["Wang", "Wong", "Li", "Lee", "Zhang", "Cheung", "Liu", "Lau", "Chen", "Chan", "Yang"];
    firstNames[3] = ["Santiago", "Sebastian", "Liam", "Angel", "Luis", "Mateo", "Miguel", "Carlos", "Diego", "Jose", "Alejandro", "Isabella", "Sophia", "Mia", "Maria", "Lucia", "Valentina", "Camila"];
    lastNames[3] = ["Fernandez", "Rodriguez", "Gonzalez", "Garcia", "Lopez", "Martinez", "Perez", "Alvarez", "Gomez", "Sanchez", "Silva", "Santos", "Sousa", "Rojas", "Diaz"];
    var streets = ["Main", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "Park", "Oak", "Dogwood", "Maple", "Pine", "Washington", "Lee", "Holly", "Elm", "Walnut", "Lake", "Sunset", "Lincoln", "Jackson", "Church", "River"];
    var streetSuffixes = ["Ave", "Blvd", "Cir", "Ct", "Dr", "Ln", "St"];
    var cityAndStates = ["New York, New York", "Los Angeles, California", "Chicago, Illinois", "Houston, Texas", "Philadelphia, Pennsylvania", "Phoenix, Arizona", "San Antonio, Texas", "San Diego, California", "Dallas, Texas", "San Jose, California", "Austin, Texas", "Jacksonville, Florida", "Indianapolis, Indiana", "San Francisco, California", "Columbus, Ohio", "Fort Worth, Texas", "Charlotte, North Carolina", "Detroit, Michigan", "El Paso, Texas", "Memphis, Tennessee", "Boston, Massachusetts", "Seattle, Washington", "Denver, Colorado", "Washington, DC", "Nashville, Tennessee", "Baltimore, Maryland", "Louisville, Kentucky", "Portland, Oregon", "Oklahoma, Oklahoma", "Milwaukee, Wisconsin", "Las Vegas, Nevada", "Albuquerque, New Mexico", "Tucson, Arizona", "Fresno, California", "Sacramento, California", "Long Beach, California", "Kansas, Missouri", "Mesa, Arizona", "Virginia Beach, Virginia", "Atlanta, Georgia", "Colorado Springs, Colorado", "Raleigh, North Carolina", "Omaha, Nebraska", "Miami, Florida", "Oakland, California", "Tulsa, Oklahoma", "Minneapolis, Minnesota", "Cleveland, Ohio", "Wichita, Kansas", "Arlington, Texas", "New Orleans, Louisiana", "Bakersfield, California", "Tampa, Florida", "Honolulu, Hawaii", "Anaheim, California", "Aurora, Colorado", "Santa Ana, California", "St. Louis, Missouri", "Riverside, California", "Corpus Christi, Texas", "Pittsburgh, Pennsylvania", "Lexington, Kentucky", "Anchorage, Alaska", "Stockton, California", "Cincinnati, Ohio", "St. Paul, Minnesota", "Toledo, Ohio", "Newark, New Jersey", "Greensboro, North Carolina", "Plano, Texas", "Henderson, Nevada", "Lincoln, Nebraska", "Buffalo, New York", "Fort Wayne, Indiana", "Jersey, New Jersey", "Chula Vista, California", "Orlando, Florida", "St. Petersburg, Florida", "Norfolk, Virginia", "Chandler, Arizona", "Laredo, Texas", "Madison, Wisconsin", "Durham, North Carolina", "Lubbock, Texas", "Winston-Salem, North Carolina", "Garland, Texas", "Glendale, Arizona", "Hialeah, Florida", "Reno, Nevada", "Baton Rouge, Louisiana", "Irvine, California", "Chesapeake, Virginia", "Irving, Texas", "Scottsdale, Arizona", "North Las Vegas, Nevada", "Fremont, California", "Gilbert town, Arizona", "San Bernardino, California", "Boise, Idaho", "Birmingham, Alabama"];
    var lengthUnits = ["in", "ft", "m", "km", "cm", "mm"];
    var weightedRegionArr = [0, 0, 0, 0, 1, 2, 3];
    var region;
    var comma = ", ";
    var semicolon = "; ";
    var leftParen = "(";
    var rightParen = ")";
    if (difficulty < 5) {
        comma = " ";
        semicolon = " ";
        leftParen = "";
        rightParen = "-";
    }
    while (returnStr.length < length) {
        dataType = randomNumber(0, difficulty);
        switch (dataType) {
        case 0:
            region = weightedRegionArr[randomNumber(0, weightedRegionArr.length - 1)];
            returnStr += firstNames[region][randomNumber(0, firstNames[region].length - 1)] + " " + lastNames[region][randomNumber(0, lastNames[region].length - 1)] + comma;
            break;
        case 1:
            returnStr += randomNumber(-9, 9) + getRandomNumbers(2) + " ";
            break;
        case 2:
            streetAddress = getRandomNumbers(3, 5);
            street = streets[randomNumber(streets.length - 1)];
            streetSuffix = streetSuffixes[randomNumber(streetSuffixes.length - 1)];
            cityAndState = cityAndStates[randomNumber(cityAndStates.length - 1)];
            zipCode = getRandomNumbers(5);
            returnStr += streetAddress + " " + street + " " + streetSuffix + " " + cityAndState + " " + zipCode + semicolon;
            break;
        case 3:
            returnStr += leftParen + getRandomNumbers(3) + rightParen + getRandomNumbers(3) + "-" + getRandomNumbers(4) + " ";
            break;
        case 4:
            returnStr += getRandomDate() + comma;
            break;
        case 5:
            returnStr += "$" + numberWithCommas(parseInt(getRandomNumbers(1, 5).toString(), 10)) + "." + getRandomNumbers(2, 2) + " ";
            break;
        case 6:
            unit = lengthUnits[randomNumber(lengthUnits.length - 1)];
            returnStr += randomNumber(1, 99) + unit + " x " + randomNumber(1, 99) + unit + " x " + randomNumber(1, 99) + unit + comma;
            break;
        case 7:
            returnStr += getRandomAlphaNumeric(5, 17).toUpperCase() + " ";
        }
    }
    return returnStr;
}
function generateNumpadText(length, opt) {
    var retStr = '';
    var decimals = ["", "."];
    var mins = [0, 1, 2, 3, 4, 4, 6, 6];
    var temp;
    var pos;
    if (typeof opt === 'undefined') {
        opt = 2;
    }
    while (retStr.length < length) {
        instOption = randomNumber(mins[opt], opt);
        switch (instOption) {
        case 0:
            retStr += getRandomNumbers(5) + "↵";
            break;
        case 1:
            temp = randomNumber(1, 9) + getRandomNumbers(3);
            pos = randomNumber(0, temp.length - 1);
            temp = temp.substr(0, pos) + "." + temp.substr(pos);
            retStr += temp + "↵";
            break;
        case 2:
            retStr += randomNumber(1, 9) + getRandomNumbers(1, 4) + "+" + randomNumber(1, 9) + getRandomNumbers(1, 4) + "↵";
            break;
        case 3:
            retStr += numTextHelper(3, 6, 1);
            break;
        case 4:
            retStr += numTextHelper(4, 7, 2);
            break;
        case 5:
            retStr += numTextHelper(5, 8, 3);
            break;
        case 6:
            retStr += numTextHelper(4, 7, 3, true);
            break;
        case 7:
            retStr += numTextHelper(8, 3, 3, true);
        }
    }
    return retStr;
}
function numTextHelper(numNums, maxNumDigis, opIndex, withDecimals) {
    if (typeof withDecimals === 'undefined')
        withDecimals = false;
    var operations = ["+", "-", "*", "/"];
    var temp;
    var pos;
    temp = getRandomNumbers(1, (maxNumDigis - 1));
    if (withDecimals) {
        pos = randomNumber(0, temp.length - 1);
        temp = temp.substr(0, pos) + "." + temp.substr(pos);
    }
    retStr = randomNumber(-9, 9, false) + temp + operations[opIndex];
    for (var lcv = 2; lcv < numNums; lcv++) {
        temp = getRandomNumbers(1, (maxNumDigis - 1));
        if (withDecimals) {
            pos = randomNumber(0, temp.length - 1);
            temp = temp.substr(0, pos) + "." + temp.substr(pos);
        }
        retStr += randomNumber(1, 9, false) + temp + operations[randomNumber(0, opIndex)];
    }
    temp = getRandomNumbers(1, (maxNumDigis - 1));
    if (withDecimals) {
        pos = randomNumber(0, temp.length - 1);
        temp = temp.substr(0, pos) + "." + temp.substr(pos);
    }
    retStr += randomNumber(1, 9, false) + temp + "↵";
    return retStr;
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function randomNumber(min, max, includeZero) {
    if (typeof includeZero === 'undefined')
        includeZero = true;
    if (typeof max === 'undefined') {
        if (typeof min === 'undefined') {
            min = 0;
            max = 9;
        } else {
            max = min;
            min = 0;
        }
    }
    var retVal = Math.floor(Math.random() * (max - min + 1)) + min;
    if (retVal == 0 && !includeZero) {
        if (max > 1)
            retVal = 1;
        else
            retVal = -1;
    }
    return retVal;
}
function getRandomNumbers(min, max) {
    if (typeof max === 'undefined') {
        if (typeof min === 'undefined') {
            min = 1;
            max = 9;
        } else {
            max = min;
        }
    }
    var numNums = randomNumber(min, max);
    var returnVal = '';
    while (returnVal.length < numNums) {
        returnVal += String(randomNumber());
    }
    return returnVal;
}
function getRandomAlphaNumeric(min, max) {
    if (typeof max === 'undefined') {
        if (typeof min === 'undefined') {
            min = 1;
            max = 9;
        } else {
            max = min;
        }
    }
    var numNums = randomNumber(min, max);
    var returnVal = '';
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    while (returnVal.length < numNums) {
        returnVal += possible.charAt(randomNumber(possible.length - 1));
    }
    return returnVal;
}
function getRandomDate() {
    var timestamp = parseInt(1 + getRandomNumbers(12));
    var d = new Date(timestamp);
    var dateString = parseInt(d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2);
    return dateString;
}
function findCSSRule(e, t) {
    ruleIndex = -1;
    for (i = 1; i < t.length; i++) {
        if (t[i].selectorText.toLowerCase() == e.toLowerCase()) {
            ruleIndex = i;
            break
        }
    }
    return ruleIndex
}
function ApplyColorsBlurred() {
    var e = new Array;
    var t = "span.plainText";
    var i = 0;
    var fs = false;
    while ((i < document.styleSheets.length) && !fs) {
        if (document.styleSheets[i].cssRules && (findCSSRule("span.goodEntry", document.styleSheets[i].cssRules) >= 0)) {
            e = document.styleSheets[i].cssRules;
            fs = true;
        } else if (document.styleSheets[i].rules && (findCSSRule("span.goodEntry", document.styleSheets[i].rules) >= 0)) {
            e = document.styleSheets[i].rules;
            fs = true;
        }
        i++;
    }
    if (fs) {
        e[findCSSRule("span.nxtLetter", e)].style.color = $("#PTFC").val();
        e[findCSSRule("span.nxtLetter", e)].style.backgroundColor = $("#PTBack").val();
    }
}
function ApplyColorsFocused() {
    var e = new Array;
    var t = "span.plainText";
    var i = 0;
    var fs = false;
    while ((i < document.styleSheets.length) && !fs) {
        if (document.styleSheets[i].cssRules && (findCSSRule("span.goodEntry", document.styleSheets[i].cssRules) >= 0)) {
            e = document.styleSheets[i].cssRules;
            fs = true;
        } else if (document.styleSheets[i].rules && (findCSSRule("span.goodEntry", document.styleSheets[i].rules) >= 0)) {
            e = document.styleSheets[i].rules;
            fs = true;
        }
        i++;
    }
    if (fs) {
        e[findCSSRule("span.nxtLetter", e)].style.color = $("#CFC").val();
        e[findCSSRule("span.nxtLetter", e)].style.backgroundColor = $("#CBack").val();
    }
}
function toggleColorContainer() {
    if ($("#colorContainer").is(":hidden")) {
        $("#colorHideIcon").attr("src", "images/minusIcon.gif");
        $("#colorHideText").html("Hide Custom Colors")
    } else {
        $("#colorHideIcon").attr("src", "images/plusIcon.gif");
        $("#colorHideText").html("Show Custom Colors")
    }
    $("#hiddenContainer").slideDown("slow", function() {});
    $("#colorContainer").toggle("slow", function() {
        if ($("#customTextContainer").is(":hidden") && $("#customTextContainer").is(":hidden") && $("#colorContainer").is(":hidden")) {
            $("#hiddenContainer").slideUp("slow", function() {})
        }
    });
}
function defaultColors() {
    $("#PTFC").attr("value", "#999999");
    $("#PTBack").attr("value", "#FFFFFF");
    $("#CTFC").attr("value", "#009900");
    $("#CTBack").attr("value", "#FFFFFF");
    $("#PSLFC").attr("value", "#009900");
    $("#PSLBack").attr("value", "#FFFFFF");
    $("#PSRFC").attr("value", "#009900");
    $("#PSRBack").attr("value", "#FFFFFF");
    $("#ITFC").attr("value", "#FF0000");
    $("#ITBack").attr("value", "#FFFFFF");
    $("#ISBack").attr("value", "#FF0000");
    $("#CFC").attr("value", "#FFFFFF");
    $("#CBack").attr("value", "#000000");
}
var lastRandNum;
var theEntry;
var testCounter = 0
function ToggleTextColoring() {
    var e = new Array;
    var t = "span.plainText";
    var i = 0;
    var fs = false;
    while ((i < document.styleSheets.length) && !fs) {
        if (document.styleSheets[i].cssRules && (findCSSRule("span.goodEntry", document.styleSheets[i].cssRules) >= 0)) {
            e = document.styleSheets[i].cssRules;
            fs = true;
        } else if (document.styleSheets[i].rules && (findCSSRule("span.goodEntry", document.styleSheets[i].rules) >= 0)) {
            e = document.styleSheets[i].rules;
            fs = true;
        }
        i++;
    }
    if (fs) {
        if ($('#colorHighlightingMode').val() == "HIGH_VISIBILITY_HIGHLIGHTS") {
            e[findCSSRule("span.goodEntry", e)].style.color = "#009900";
            e[findCSSRule("span.bad_Entry", e)].style.color = "#5c0000";
            e[findCSSRule("span.bad_Entry", e)].style.backgroundColor = "#ff4e4e";
            e[findCSSRule("span.bad_Space", e)].style.color = "#999";
            e[findCSSRule("span.bad_Space", e)].style.backgroundColor = "#FF0000";
            e[findCSSRule("span.phaseLeft", e)].style.color = "#009900";
            e[findCSSRule("span.phaseLeft", e)].style.backgroundColor = "#F2C900";
            e[findCSSRule("span.phaseRght", e)].style.color = "#009900";
            e[findCSSRule("span.phaseRght", e)].style.backgroundColor = "#F2C900";
        } else if ($('#colorHighlightingMode').val() == "NO_COLOR_HIGHLIGHTS") {
            e[findCSSRule("span.goodEntry", e)].style.color = "#999999";
            e[findCSSRule("span.bad_Entry", e)].style.color = "#999999";
            e[findCSSRule("span.bad_Entry", e)].style.backgroundColor = "transparent";
            e[findCSSRule("span.bad_Space", e)].style.color = "#999";
            e[findCSSRule("span.bad_Space", e)].style.backgroundColor = "transparent";
            e[findCSSRule("span.phaseLeft", e)].style.color = "#999999";
            e[findCSSRule("span.phaseLeft", e)].style.backgroundColor = "transparent";
            e[findCSSRule("span.phaseRght", e)].style.color = "#999999";
            e[findCSSRule("span.phaseRght", e)].style.backgroundColor = "transparent";
        } else {
            e[findCSSRule("span.goodEntry", e)].style.color = "#009900";
            e[findCSSRule("span.bad_Entry", e)].style.color = "#FF0000";
            e[findCSSRule("span.bad_Entry", e)].style.backgroundColor = "transparent";
            e[findCSSRule("span.bad_Space", e)].style.color = "#999";
            e[findCSSRule("span.bad_Space", e)].style.backgroundColor = "#FF0000";
            e[findCSSRule("span.phaseLeft", e)].style.color = "#009900";
            e[findCSSRule("span.phaseLeft", e)].style.backgroundColor = "#F2C900";
            e[findCSSRule("span.phaseRght", e)].style.color = "#009900";
            e[findCSSRule("span.phaseRght", e)].style.backgroundColor = "#F2C900";
        }
    }
}
