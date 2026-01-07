# e2e tests

The testing approach and outcomes are documented in the attached report.

Additionally, user stories implemented in previous sprints but still carrying open issues at the start of this sprint were also included in the testing scope to validate the corresponding fixes and updates.

## Story 28 - Report visualization (unregistered user)

### Test 28.1: Report visualization

| Step | Description               |
| ---- | ------------------------- |
| 1    | Open the application      |
| 2    | Ensure user is logged out |

| Expected Outcome                               | Actual outcome                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| The user is able to see the reports on the map | The user is able to see the reports on the map |

## Story 15 - Anonymous reports

### Test 15.1: Report filtering

| Step | Description                                         |
| ---- | --------------------------------------------------- |
| 1    | Login with a valid citizen account                  |
| 2    | Insert data for a report                            |
| 3    | Check the "Submit Anonymously" option               |
| 4    | Login with a valid Public Relations Officer account |
| 5    | Navigate to the "Review Reports" section            |

| Expected Outcome                      | Actual outcome                        |
| ------------------------------------- | ------------------------------------- |
| The reporter is marked as "Anonymous" | The reporter is marked as "Anonymous" |

## Story 30 - Search report by address

### Test 30.1: Search an existing report

| Step | Description                                                             |
| ---- | ----------------------------------------------------------------------- |
| 1    | Login with a valid citizen account                                      |
| 2    | Go to the "Write a report" screen using the button on the top bar       |
| 3    | Select the entrance of the main building of the "Politecnico di Torino" |
| 4    | Complete and submit the report                                          |
| 5    | Write and submit a report in a different location                       |
| 6    | Login with a valid Public Relations Officer account                     |
| 7    | Navigate to the "Review Reports" section                                |
| 8    | Assign the reports to a Yechnical Officer                               |
| 9    | Login with a valid Technical Officer account                            |
| 10   | Set the reports to "IN PROGRESS"                                        |
| 11   | Log out                                                                 |
| 12   | Search "Politecnico di Torino"                                          |

| Expected Outcome                                            | Actual outcome                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| The screen shows only the report at "Politecnico di Torino" | The screen shows only the report at "Politecnico di Torino" |


### Test 30.2: Search a non-existing report

Starts from test 30.1

| Step | Description                                              |
| ---- | -------------------------------------------------------- |
| 13   | Search a location different from "Politecnico di Torino" |

| Expected Outcome                    | Actual outcome                      |
| ----------------------------------- | ----------------------------------- |
| The screen does not show any report | The screen does not show any report |


## Story 13 - Check report via Telegram

### Test 13.1: Existing report

| Step | Description                                                       |
| ---- | ----------------------------------------------------------------- |
| 1    | Login with a valid citizen account                                |
| 2    | Set the Telegram username                                         |
| 3    | Go to the "Write a report" screen using the button on the top bar |
| 5    | Write and submit a report                                         |
| 6    | Login with a valid Public Relations Officer account               |
| 7    | Navigate to the "Review Reports" section                          |
| 8    | Assign the reports to a Yechnical Officer                         |
| 9    | Login with a valid Technical Officer account                      |
| 10   | Set the reports to "IN PROGRESS"                                  |
| 11   | Access the Telegram bot                                           |
| 12   | Use the /start command to start the bot                           |
| 13   | Use the /login command to log in                                  |
| 14   | Press the "View My Active Reports" button                         |

| Expected Outcome    | Actual outcome      |
| ------------------- | ------------------- |
| The report is shown | The report is shown |

### Test 13.2: Non-existing report

| Step | Description                                            |
| ---- | ------------------------------------------------------ |
| 1    | Login with a valid citizen account without any reports |
| 2    | Set the Telegram username                              |
| 3    | Access the Telegram bot                                |
| 4    | Use the /start command to start the bot                |
| 5    | Use the /login command to log in                       |
| 6    | Press the "View My Active Reports" button              |

| Expected Outcome   | Actual outcome     |
| ------------------ | ------------------ |
| No report is shown | No report is shown |

## Story 14 - Telegram assistance

### Test 14.1: Basic Commands button

| Step | Description                                            |
| ---- | ------------------------------------------------------ |
| 1    | Login with a valid citizen account without any reports |
| 2    | Set the Telegram username                              |
| 3    | Access the Telegram bot                                |
| 4    | Use the /start command to start the bot                |
| 5    | Use the /login command to log in                       |
| 6    | Press the "Help" button                                |
| 7    | Press the "Basic Commands" button                      |

| Expected Outcome              | Actual outcome                |
| ----------------------------- | ----------------------------- |
| The bot's commands are listed | The bot's commands are listed |

### Test 14.2: FAQ button

| Step | Description                                            |
| ---- | ------------------------------------------------------ |
| 1    | Login with a valid citizen account without any reports |
| 2    | Set the Telegram username                              |
| 3    | Access the Telegram bot                                |
| 4    | Use the /start command to start the bot                |
| 5    | Use the /login command to log in                       |
| 6    | Press the "Help" button                                |
| 7    | Press the "FAQ" button                                 |

| Expected Outcome               | Actual outcome                 |
| ------------------------------ | ------------------------------ |
| The configured FAQs are listed | The configured FAQs are listed |

### Test 14.3: Contact Support button

| Step | Description                                            |
| ---- | ------------------------------------------------------ |
| 1    | Login with a valid citizen account without any reports |
| 2    | Set the Telegram username                              |
| 3    | Access the Telegram bot                                |
| 4    | Use the /start command to start the bot                |
| 5    | Use the /login command to log in                       |
| 6    | Press the "Help" button                                |
| 7    | Press the "Contact Support" button                     |

| Expected Outcome             | Actual outcome               |
| ---------------------------- | ---------------------------- |
| Contact information is shown | Contact information is shown |

## Story 18 - Reply to operators

### Test 18.1: Exchange information

| Step | Description                                                                |
| ---- | -------------------------------------------------------------------------- |
| 1    | Login with a valid citizen account                                         |
| 2    | File a report of the Water Supply category                                 |
| 3    | Open a new window                                                          |
| 4    | Log In with the account of a Technical Officer for the Water Supply office |
| 5    | Navigate to the "Technical Workspace" screen                               |
| 6    | Click the "Chat" button                                                    |
| 7    | Send a message from the Officer account                                    |
| 8    | Navigate back to the window with the Citizen account                       |
| 9    | Send a message from the Citizen account                                    |

| Expected Outcome                                      | Actual outcome                                        |
| ----------------------------------------------------- | ----------------------------------------------------- |
| The messages are received in real time on each window | The messages are received in real time on each window |

### Test 18.2: Anonymous report

| Step | Description                                                                |
| ---- | -------------------------------------------------------------------------- |
| 1    | Login with a valid citizen account                                         |
| 2    | File an anonymous report of the Water Supply category                      |
| 3    | Open a new window                                                          |
| 4    | Log In with the account of a Technical Officer for the Water Supply office |
| 5    | Navigate to the "Technical Workspace" screen                               |
| 6    | Click the "Chat" button                                                    |
| 7    | Send a message from the Officer account                                    |
| 8    | Navigate back to the window with the Citizen account                       |
| 9    | Send a message from the Citizen account                                    |

| Expected Outcome                                                                                      | Actual outcome                                                                                        |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| The messages are received in real time on each window and the username for the citizen is not visible | The messages are received in real time on each window and the username for the citizen is not visible |