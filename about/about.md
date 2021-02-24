# Introduction

ActDev is a project to develop a strong and nationally scalable evidence base on walking and cycling potential and provision in and around new development sites.
In the first phase of work, we developed a prototype web application showing walking and cycling route from 35 housing developments to key 'trip attractors' and calculated walking and cycling metrics within the boundary of each site.
The results demonstrate the importance of considering walking and cycling potential and provision early in the planning process, the possibility of quantifying walking and cycling opportunities associated with new developments, and the feasibility of developing an actionable evidence base that will enable the planning process to support ambitious walking, cycling and decarbonisation targets nationawide. 

# High level aims

The high level aims of are to provides ratings for the level of active travel provision (cycling and walking) between development sites and key services, to determine whether a location would be or is acceptable from health perspectives.

For known planned/existing development sites, the tool will provide additional analysis to inform specific improvements that could be made in active travel provision and proximity of key services within walking and cycling distance.
Makes the case for further work to create an interactive web application (including the underlying evolving evidence base) to do the above but on a national scale.

# Stretch Goals

Expand (a) to include environmental and safety perspectives, not just health.
Use historical data to model the likely mode split associated with potential development sites.

# Planning data

The PlanIt API provides access to planning application data from Local Authorities across the UK. Options without the API include the ability to specify app_size, app_state and app_type.
app_size is classified as small, medium or large.
app_state is the decision status of the application, classified as undecided, permitted, conditions, rejected, withdrawn, referred, or other.
app_type is classified as full, outline, amendment, conditions, heritage, trees, advertising, telecoms, or other.
Applications for major new housing developments should be classified as Large. As part of ActDev, we are improving the app_size classification by validating it against a set of around 30 known large housing developments across England. We are also investigating how the proportion of planning applications classified as large varies from one Local Authority to another.
