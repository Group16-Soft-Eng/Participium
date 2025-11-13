TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done : 7 / 7
- Total points committed vs. done : 21 / 21
- Nr of hours planned vs. spent (as a team): 92 / 96

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story                          | # Tasks | Points | Hours est. | Hours actual |
| ------------------------------ | ------- | ------ | ---------- | ------------ |
| _Uncategorized_                | 10      | //     | 34 h       | 38 h 25m     |
| PT01: Citizer Registration     | 6       | 1      | 7 h        | 7 h 15 m     |
| PT02: Municipality users setup | 6       | 1      | 7 h        | 8 h 15 m     |
| PT03: Role assignment          | 5       | 1      | 5 h 30 m   | 5 h 20 m     |
| PT04: Select Location          | 4       | 5      | 17 h       | 12 h 23 m    |
| PT05: Report creation          | 6       | 3      | 6 h        | 7 h 45 m     |
| PT06: Report review            | 4       | 2      | 7 h        | 6 h 10 m     |
| PT07: Report visualization     | 4       | 8      | 12 h 30 m  | 7 h 25 m     |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
| ---------- | ---- | ----- |
| Estimation |      |       |
| Actual     |      |       |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| $$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated
  - Total hours spent
  - Nr of automated unit test cases 
  - Coverage
- E2E testing:
  - Total hours estimated
  - Total hours spent
  - Nr of test cases
- Code review 
  - Total hours estimated 
  - Total hours spent
  


## ASSESSMENT

- What did go wrong in the sprint?

- What caused your errors in estimation (if any)?

- What lessons did you learn (both positive and negative) in this sprint?

- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two

- One thing you are proud of as a Team!!