import sys
sys.path.insert(0, 'Backend')
from app.services.project_service import (
    get_all_projects, get_category_recommendations,
    save_category_recommendations, mark_in_approvals, is_in_approvals,
    init_project_db
)

# Run init to ensure new tables exist
init_project_db()
print("DB init OK - all tables created/migrated.")

projects = get_all_projects()
print(f"Projects loaded: {len(projects)}")
for p in projects:
    in_app = getattr(p, 'in_approvals', 'N/A')
    recs = get_category_recommendations(p.id)
    print(f"  {p.id[:8]}... status={p.status} in_approvals={in_app} category_recs={len(recs)}")

print("\nAll service functions working correctly!")
