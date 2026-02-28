# Conway's Mirror: When Systems Meet _Alternate_ Realities

## The Problem

We've all seen it happen. An organization adopts microservices and ends up with ten silos instead of one monolith. A team embraces Agile but still operates like waterfall with standups. A company implements data mesh only to discover they've distributed dysfunction instead of solving it.

The pattern is so common it's almost predictable: adopt a new system, practice, or methodology; discover it doesn't deliver the promised benefits; blame the system and move on to the next thing. Rinse, repeat.

What is actually happening in these situations?

## Conway's Law: The Foundation

In 1968, Melvin Conway observed something elegant and fundamental:

> ["Any organization that designs a system (defined more broadly here than just information systems) will inevitably produce a design whose structure is a copy of the organization's communication structure."](https://www.melconway.com/Home/Committees_Paper.html)

This has become known as Conway's Law. It describes an **inside-out** relationship: the organization's structure flows naturally into the systems it creates. A team organized into front-end and back-end groups will produce systems with front-end/back-end divisions. A company with siloed departments will create siloed architectures. The effect of Conway's Law on _software_ systems has been [frequently](https://martinfowler.com/bliki/ConwaysLaw.html) [cited](https://www.microsoft.com/en-us/microsoft-365-life-hacks/organization/what-is-conways-law) [in](https://www.atlassian.com/blog/teamwork/what-is-conways-law-acmi) [software](https://www.splunk.com/en_us/blog/learn/conways-law.html) [circles](https://www.thoughtworks.com/en-ca/insights/articles/demystifying-conways-law).

Conway's Law is descriptive, not prescriptive. It simply observes what happens when organizations create systems. The communication paths that exist (or don't exist) in the organization manifest themselves in the structure of what gets built.

What doesn't seem to be discussed fully are the implications of the bidirectional nature of Conway's Law.

## The Mirror: Outside-In Adoption

There is another dynamic is at play, one that operates in the opposite direction. When organizations adopt systems – whether tools, practices, or methodologies – from the outside, something different happens.

Call it **Conway's Mirror** since it is the inverse of Conway’s Law: 

> When an organization adopts an external system born from an alternate reality and doesn't change its underlying reality to match, the organization will warp, resist, or neutralize that system until it conforms to the existing organizational structure.

The flow is **outside-in**: 

external system → attempts to fit into organization → organizational reality resists → system gets neutralized

Which explains why:

- **Data mesh** implementations create new silos instead of eliminating them
- **Scrum** adoptions maintain waterfall thinking with new ceremonies
- **Microservices** architectures become distributed monoliths
- **DevOps** transformations preserve the dev/ops divide with new tooling

The organization takes the new system and bends it back into familiar shape.

## Beyond Communication: The Full Reality

Conway focused specifically on **communication structure** as the organizing principle. But the mirror effect (and probably "regular" Conway’s Law?) operates across a broader spectrum of organizational reality:

**Culture**: What behaviors are celebrated, tolerated, or punished? How do people actually interact day-to-day?

**Values**: What does the organization truly prioritize when push comes to shove? Speed or safety? Innovation or stability? Individual achievement or collective success?

**Incentives**: What gets rewarded in promotions, bonuses, and performance reviews? What gets people fired or sidelined?

**Power structures**: Who actually makes decisions? Where does authority really reside, regardless of the org chart?

**Resource allocation**: How are budgets decided? Who controls headcount, tooling choices, time allocation?

**Mindset**: What assumptions do people hold about how work should be done, problems should be solved, success should be measured?

This constellation of factors ‒ call it organizational substrate, organizational reality, or simply "how things actually work around here" ‒ is what the external system encounters when it arrives.

## Why Systems Encode Worldviews

Here's the crucial insight from Conway's Law: **systems ‒ which includes practices, both manual and software systems, and methodologies ‒ aren't neutral tools**. They encode assumptions about how work should flow, how people should collaborate, what problems matter most, and what success looks like.

Consider:

**Microservices** assume: teams can make independent decisions, deploy independently, own their services end-to-end, and coordinate through well-defined contracts.

**Data mesh** assumes: domains understand their data better than central teams, ownership can be federated, teams will coordinate through shared standards, and governance can be distributed.

**Scrum** assumes: teams can adapt plans based on empirical feedback, customer needs can evolve, working software is the measure of progress, and self-organization produces better outcomes than command-and-control.

**Test-Driven Development** assumes: rapid feedback is valuable, design emerges through refactoring, test-first discipline is worth the initial investment, and internal quality matters.

These aren't just technical choices. They're **philosophies about how work should be organized**. They come from specific contexts where certain values, structures, and ways of thinking were already in place.

## The Mismatch

When you extract these systems from their native contexts and drop them into organizations with different realities, something has to give.

**Option A – Transformation**: The organization genuinely transforms its culture, structure, incentives, and mindset to align with the system's assumptions. This is hard, expensive, and threatening to existing power structures. It requires real change.

**Option B – Adapt vs Adopt or Abort**: The organization honestly assesses the mismatch, decides transformation isn't worth it or isn't feasible, and either doesn't adopt the system or adapts it substantially to fit their reality. Be mindful that "adapting" a system changes it. The value this modified system delivers will likely change as well, risking the same results as Option C. 

**Option C – Theater (most common)**: The organization adopts the surface features of the system while maintaining its existing reality. The mismatch creates friction. The existing reality slowly warps the system until it no longer resembles what it was supposed to be. Benefits don't materialize. The system gets blamed.

## We Tried Baseball and It Didn't Work

Ron Jeffries captured this perfectly in ["We Tried Baseball and It Didn't Work"](https://ronjeffries.com/xprog/articles/jatbaseball/). How did they try baseball in his allegory? With four players instead of nine, one base instead of four, a stuffed sock instead of a ball, and sticks instead of bats. 

Obviously they didn't actually try "baseball". They tried something that vaguely resembled baseball while removing everything that makes baseball what it is, then declared baseball itself a failure.

This is exactly what happens with Agile, microservices, data mesh, refactoring, and countless other practices: organizations adopt the vocabulary and some surface ceremony while maintaining their underlying reality that prevents the approach from working. When it fails, they blame the system. They tried _____. It didn't work.

## Self-Similarity Across Scales

In Extreme Programming, Kent Beck observed that the same patterns repeat at different scales ‒ what he calls **self-similarity**. This applies here as well.

Just like Conway's Law, the mirror effect operates at every level:

**Individual**: A developer tries TDD but maintains their design-then-implement mindset. Red-green-refactor becomes an awkward ceremony instead of a design tool.

**Team**: A team adopts Scrum but maintains waterfall assumptions. Sprints become mini-waterfalls with planning, execution, and testing phases.

**Department**: A department implements microservices but maintains centralized decision-making. Services can't be deployed independently because every change is coupled together on an Agile Release Train.

**Company**: A company embraces data mesh but maintains centralized control. Domain teams can't actually own their data products because the central platform team controls all infrastructure decisions.

The same dynamic plays out at each level: new external system meets existing internal reality, system is neutralized.

## The Self-Deception Problem

The most insidious aspect of this pattern is **self-deception**. Organizations and individuals often don't recognize the mismatch because they've adopted the language of the new system.

Command-and-control management uses words like "empowerment" and "self-organization" while continuing to make all meaningful decisions.

The centralized organization talks about "domain ownership" while requiring central approval for everything.

The waterfall team celebrates their "agility" because they have standups and two-week iterations.

**Semantic diffusion** ‒ Martin Fowler's term for when words lose their meaning ‒ combines with self-deception to create organizations that genuinely believe they've transformed when they haven't.

They blame the system for failing rather than recognizing they never actually implemented it.

## What To Do About It

First, **honest self-assessment**. Before adopting any system, practice, or methodology, understand your organizational reality:

- What do we actually value when priorities conflict?
- How do decisions really get made?
- What behaviors get rewarded or punished?
- How do resources actually flow?
- What assumptions do people hold about how work should be done?

Second, **understand what the system assumes**. Don't just learn the practices; understand the worldview:

- What does this system assume about decision-making?
- What does it assume about coordination?
- What does it assume about ownership and accountability?
- What does it assume about feedback and adaptation?
- What values does it encode?

Kent Beck highlights this by explicitly describing Extreme Programming's underlying worldview via Principles and Values.The key to XP is to understand the underlying principles and values that drive the practices. If you don't understand the principles, you can't apply or adapt the practices effectively. This applies to all systems.

Third, **be honest about the match**:

- Does this system's worldview align with our reality?
- Are we willing to genuinely transform to make it align?
- If not, can we adapt the system to our reality while keeping what's valuable? Or will our adaptation effectively neutralize the system?
- Should we look for something different?

Fourth, **if you choose transformation, actually transform**:

- Change incentives and rewards
- Redistribute power and decision-making authority
- Allocate resources differently
- Model the new behaviors from leadership
- Be patient ‒ culture change takes years, not months

Fifth, **if you don't transform, don't pretend you did**:

- Be honest about what you've actually adopted
- Don't blame the system when it doesn't deliver benefits you never properly enabled
- Optimize what you actually are, not what you wish you were

## Beyond IT

While this article focuses on software and IT practices, the pattern is universal.

Organizations adopt lean manufacturing without changing their batch-and-queue mindset. Schools implement "student-centered learning" while maintaining factory-model structures. Governments create new agencies to solve problems that their existing structures make unsolvable.

Conway's original paper noted this: 
> ["My current favorite [application] is the complex of social issues encompassing poverty in America: access to labor markets, housing, education, and health care."](https://www.melconway.com/Home/Committees_Paper.html)

The mirror effect applies anywhere systems meet organizational reality. The same dynamics play out whether you're adopting TDD or implementing universal healthcare.

## Conclusion

Systems, practices, and methodologies aren't neutral tools you can drop into any context and expect to work. They encode worldviews, and they only deliver their promised benefits when the organization's reality aligns with that worldview.

Conway's Law describes the inside-out flow:
organizational reality → shapes → systems created.

Conway's Mirror describes the outside-in resistance: external system → encounters → organizational reality → gets neutralized.

Together, they form a more complete picture of the relationship between organizations and the systems they adopt or create.

The key insight: **technology is easy, transformation is hard**. Changing your architecture, your tools, or your process is (relatively) straightforward. Changing your culture, your values, your incentives, your power structures, and your fundamental assumptions about how work should be done ‒ that's the real challenge.

Most organizations won't do it. They'll adopt the new shell without changing what's inside. And they'll wonder why the promised benefits never materialize.

The ones that succeed will be those that achieve honest self-awareness about their reality and make conscious, deliberate choices about alignment ‒ either transforming to match the system or adapting the system to match their reality.

The worst outcomes come from self-deception: believing you've transformed when you haven't, adopting the language without the substance, doing Agile without being agile.

Know your reality. Know what systems assume. Be honest about the match. And whatever you choose, actually choose it deliberately rather than stumbling into theater.

The system will work in your context or it won't. But at least you'll know why.

---

*Special thanks to the insights of Melvin Conway, Martin Fowler, Ron Jeffries, Kent Beck, Gregor Hohpe, Bill Caputo, and the countless practitioners who've lived through these patterns and shared their hard-won wisdom.*

---

_**Important Note**:_ 

_Conway's Law has been written about extensively by many in the software industry. However, I have not seen this explicit bidirectional symmetry identified as Conway's Law - namely, positioning external system adoption as the symmetric complement to Conway's original observation about system creation:_

* _Inside-out:_ 
  * _Your structure → shapes → systems you create_
* _Outside-in:_ 
  * _External systems (carrying embedded structures) → encounter → your structure → friction_

_Conway's Mirror "outside-in" framing appears to be novel in these specific ways:_
* _Explicit positioning as Conway's bidirectional/symmetric complement_
* _Mechanism of embedded organizational structures beyond just communication_
* _General applicability to any system adoption (using Conway's own broader System definition, including tools, practices, methodologies, et cetera)_
* _Framework for conscious adoption decisions, including the option to **not** adopt based on structural incompatibility between system and organization_

_However, the underlying observations are well-established in:_
* _Sociotechnical systems theory_
* _Technology adoption failure literature_
* _Organizational change management research_

_This article aims simply to synthesize these existing observations into a framing that explicitly connects to Conway's Law and highlight its symmetric nature. Just as Conway's Law itself wasn't discovering something entirely new, but articulating it precisely enough to become a useful conceptual tool._