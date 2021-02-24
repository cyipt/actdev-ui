# Introduction

Following on from the progress made in ACTON, ActDev is a four month project to further develop quantifiable measures of the accessibility of new housing developments for walking and cycling.


# High level aims

The high level aims of ActDev are to create a tool which:
Provides a rating for the level of active travel provision (cycling and walking) between development sites and key services, to determine whether a location would be or is acceptable from health perspectives.

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
