# Example 3 (Before): Overly Complex 64-Node Flow

## Problem

Overly detailed flowchart with 64 nodes showing every decision point. While technically correct, it's cognitively overwhelming and hard to follow.

**Issue**: Shows every fine-grained decision, creating excessive complexity

```mermaid
flowchart TD
    Start([Config Loading Starts]) --> CheckEnv{RIPGREP_CONFIG_PATH
set?}

    CheckEnv -->|No| NoConfig[No config loaded]
    CheckEnv -->|Empty value| NoConfig
    CheckEnv -->|Yes| ReadFile[Attempt to read file]

    ReadFile --> FileExists{File
exists?}

    FileExists -->|No| FileError[Error: File not found]
    FileExists -->|Permission denied| FileError
    FileError --> NoConfig

    FileExists -->|Yes| ParseLines[Parse lines sequentially]

    ParseLines --> CheckLine{Process
each line}

    CheckLine --> IsEmpty{Empty
line?}
    IsEmpty -->|Yes| NextLine[Skip to next line]

    IsEmpty -->|No| IsComment{Starts with
'#'?}
    IsComment -->|Yes| NextLine

    IsComment -->|No| ConvertUTF8{Valid
UTF-8?}

    ConvertUTF8 -->|Yes| AddArg[Add to arguments list]
    AddArg --> NextLine

    ConvertUTF8 -->|No| Platform{Platform?}
    Platform -->|Unix-like| ParseErr[Report parse error
with line number]
    Platform -->|Windows| ParseErr

    ParseErr --> NextLine
    NextLine --> MoreLines{More
lines?}

    MoreLines -->|Yes| CheckLine
    MoreLines -->|No| ReportErrs{Parse errors
occurred?}

    ReportErrs -->|Yes| ShowErrs[Display errors
with line numbers]
    ReportErrs -->|No| Success[Config loaded successfully]

    ShowErrs --> Success
    NoConfig --> End([Continue with CLI args only])
    Success --> End
```

## Expected Validation Result

When running `npx mermaid-sonar --viewport-profile mkdocs` on this file:

```
❌ Complex diagram with excessive nodes
❌ Cyclomatic complexity: 45 (threshold: 15)
```

## The Fix

See `example-3-after.md` for the simplified 13-node version.
