# Repeat and reproduce
1. Read active index and referenced task/checkpoint only; inspect Git state with resume command.
2. Compare recorded HEAD, branch and dirty paths with actual state. Check safe patch hash and local evidence prerequisites manually before claiming full reproduction.
3. Run the recorded synthetic reproduction/checks in the recorded environment. Report differences, not assumed success.
4. Respect existing owners and persistent failure counts. Continue the smallest independent next step.
5. Write checkpoint; inspect privacy; commit verified state to a working branch for durable memory.

One stable task ID per defect. Do not rename or split the same defect across task records. Serialize state CLI writes; this version has no concurrent-writer lock.
