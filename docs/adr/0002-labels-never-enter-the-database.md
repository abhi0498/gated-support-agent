# Labels never enter the database

Ground-truth labels (intent, expected action, required facts) live only in the seed's eval set and are joined to results by ticket ref inside the eval runner. The database holds only what a real support system would receive, so no tool, prompt or query path can leak the answer to the agent, and eval numbers can't be inflated by accident. The cost is that the review UI can't show "expected vs actual" from the database alone; the eval report shows it instead.
