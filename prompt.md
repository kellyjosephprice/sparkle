I'd like to make the rules to sparkle more customizable. Could we update
`app/scoring.ts` to have a list of toggleable rules? I would also like it to
track how many times a rule has been activated.

Each item will show the following:

- a legend or description as it does now ('1', '5', '111', etc.)
- a scoring value
- a counter of how many times the rule has been activated
- a checkbox for toggling the rule on or off

An example:

| rule | score | count | on/off |
| ---- | ----- | ----- | ------ |
| 1    | 100   | 0     | ✔     |
