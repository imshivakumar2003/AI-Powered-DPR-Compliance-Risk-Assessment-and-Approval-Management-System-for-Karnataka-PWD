# TOPLINE

import random
from typing import List, Dict


class RecommendationService:
    """
    AI Recommendation Engine for DPR projects.
    In production, this would use ML models trained on historical DPR data.
    Currently returns intelligent simulated recommendations based on
    project context (sector, risk level, quality scores).
    """

    # Sector-specific recommendation templates
    SECTOR_RECOMMENDATIONS: Dict[str, List[Dict]] = {
        "Roads": [
            {
                "category": "Technical",
                "title": "Conduct advanced geotechnical investigation",
                "description": "The DPR lacks detailed soil bearing capacity data for bridge foundations. Conduct Standard Penetration Test (SPT) at all proposed bridge locations.",
                "impact": "Reduces foundation failure risk by up to 40%",
                "steps": ["Commission geotechnical survey firm", "Conduct SPT at all bridge sites", "Update foundation design based on findings"],
            },
            {
                "category": "Financial",
                "title": "Increase cost contingency to 12%",
                "description": "Current contingency at 5% is below the MoRTH recommended 10-15% for Himalayan terrain projects. Historical data shows 23% average cost overrun in similar projects.",
                "impact": "Prevents budget shortfall during construction phase",
                "steps": ["Revise cost estimates with terrain-adjusted rates", "Add 12% contingency provision", "Submit revised financial plan to Karnataka PWD"],
            },
            {
                "category": "Environmental",
                "title": "Complete Wildlife Impact Assessment",
                "description": "The project corridor passes through notified eco-sensitive zone. A Wildlife Impact Assessment is mandatory under MOEFCC guidelines.",
                "impact": "Avoids project halt due to regulatory non-compliance",
                "steps": ["Engage MOEFCC-approved ecological consultants", "Conduct wildlife corridor survey", "Submit WIA report to State Wildlife Board"],
            },
        ],
        "Power": [
            {
                "category": "Technical",
                "title": "Add seismic resilience assessment",
                "description": "Project falls in Seismic Zone V. The DPR does not include seismic load calculations per IS 1893:2016 standards.",
                "impact": "Ensures structural safety compliance for power infrastructure",
                "steps": ["Engage structural engineer for seismic analysis", "Redesign foundations for Zone V compliance", "Update structural drawings"],
            },
            {
                "category": "Sustainability",
                "title": "Include O&M cost projection for 25 years",
                "description": "Post-commissioning O&M budget is not included. Karnataka PWD requires lifecycle cost analysis for power projects above ₹100 Cr.",
                "impact": "Ensures long-term project viability and fund allocation",
                "steps": ["Project annual O&M costs for 25 years", "Include equipment replacement schedule", "Add trained manpower requirements"],
            },
        ],
        "Healthcare": [
            {
                "category": "Stakeholder",
                "title": "Conduct community health needs assessment",
                "description": "The DPR proposes facility upgrades without baseline community health data. WHO guidelines recommend needs assessment before infrastructure planning.",
                "impact": "Ensures facility design matches actual healthcare demand",
                "steps": ["Survey target population health needs", "Consult district health officer", "Align facility design to identified gaps"],
            },
            {
                "category": "Technical",
                "title": "Include biomedical waste management plan",
                "description": "BMW Rules 2016 mandate waste management infrastructure for all healthcare facilities. This is missing from the current DPR.",
                "impact": "Regulatory compliance and environmental safety",
                "steps": ["Design BMW storage and treatment facility", "Include autoclaving unit in equipment list", "Add BMW training for staff in project plan"],
            },
        ],
    }

    # Generic recommendations applicable to all sectors
    GENERIC_RECOMMENDATIONS = [
        {
            "category": "Risk",
            "title": "Establish multi-agency risk monitoring committee",
            "description": "Set up a joint committee with state and central agencies to monitor project risks on a quarterly basis. This is recommended for all projects above ₹50 Cr.",
            "impact": "Early risk detection and coordinated mitigation response",
            "steps": ["Identify key stakeholder agencies", "Draft committee ToR and meeting schedule", "Set up digital risk dashboard for tracking"],
        },
        {
            "category": "Timeline",
            "title": "Add monsoon contingency buffer to timeline",
            "description": "NE India experiences 4-5 months of heavy monsoon. The current timeline does not account for weather-related work stoppages.",
            "impact": "Realistic timeline reduces schedule overrun by 30%",
            "steps": ["Identify monsoon-sensitive activities", "Add 3-month buffer for monsoon season", "Plan indoor/preparatory work during monsoon"],
        },
        {
            "category": "Procurement",
            "title": "Front-load procurement before monsoon season",
            "description": "Material transportation to NE states is severely impacted during monsoon. Procurement should be completed by March for projects starting in April-May.",
            "impact": "Avoids 2-3 month material shortage delays",
            "steps": ["Prepare advance procurement schedule", "Identify local material sources as backup", "Pre-qualify contractors by December"],
        },
        {
            "category": "Financial",
            "title": "Include price escalation clause",
            "description": "Multi-year projects in NE region face 8-12% annual material cost inflation. The DPR should include escalation provisions per MoF guidelines.",
            "impact": "Prevents cost disputes and contractor claims during execution",
            "steps": ["Add price variation clause per MoF OM", "Use WPI-linked escalation formula", "Budget 8% annual escalation in estimates"],
        },
        {
            "category": "Compliance",
            "title": "Verify land acquisition clearances",
            "description": "Ensure all land parcels have clear titles and NOCs from revenue department. Incomplete land acquisition is the #1 cause of project delays in NE India.",
            "impact": "Eliminates land dispute-related project stoppages",
            "steps": ["Verify title deeds for all parcels", "Obtain NOC from District Collector", "Complete R&R plan per LARR Act 2013"],
        },
    ]

    @staticmethod
    def generate_recommendations(dpr_data: dict) -> dict:
        """
        Generate context-aware recommendations for a DPR.
        In production, this would use an ML model. Currently uses
        rule-based logic with sector-specific templates.
        """
        sector = dpr_data.get("sector", "")
        risk_level = dpr_data.get("risk_level", "Low")
        quality_score = dpr_data.get("quality_score", 75)

        recommendations = []
        rec_id = 1

        # Get sector-specific recommendations
        sector_recs = RecommendationService.SECTOR_RECOMMENDATIONS.get(sector, [])
        for rec in sector_recs:
            priority = "critical" if risk_level == "High" else "high" if risk_level == "Medium" else "medium"
            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "category": rec["category"],
                "priority": priority,
                "title": rec["title"],
                "description": rec["description"],
                "impact": rec["impact"],
                "actionable_steps": rec["steps"],
            })
            rec_id += 1

        # Add generic recommendations based on quality score & risk
        generic_pool = RecommendationService.GENERIC_RECOMMENDATIONS.copy()
        random.shuffle(generic_pool)

        num_generic = 4 if risk_level == "High" else 3 if risk_level == "Medium" else 2
        for rec in generic_pool[:num_generic]:
            if quality_score < 60:
                priority = "critical"
            elif quality_score < 75:
                priority = "high"
            else:
                priority = "medium"

            recommendations.append({
                "id": f"REC-{rec_id:03d}",
                "category": rec["category"],
                "priority": priority,
                "title": rec["title"],
                "description": rec["description"],
                "impact": rec["impact"],
                "actionable_steps": rec["steps"],
            })
            rec_id += 1

        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda r: priority_order.get(r["priority"], 99))

        critical_count = sum(1 for r in recommendations if r["priority"] == "critical")
        high_count = sum(1 for r in recommendations if r["priority"] == "high")

        return {
            "dpr_id": dpr_data.get("id", "unknown"),
            "total_recommendations": len(recommendations),
            "critical_count": critical_count,
            "high_count": high_count,
            "recommendations": recommendations,
        }
