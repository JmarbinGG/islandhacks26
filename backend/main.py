from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, or_, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./listings.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    image = Column(String)
    owner = Column(String)
    location = Column(String)
    quantity = Column(String)
    email = Column(String)
    mailtolink = Column(String)
    status = Column(String, default="available")
    category = Column(String)
    tags = Column(String)  # comma-separated keywords, e.g. "wood,lumber,pallets"


Base.metadata.create_all(bind=engine)

MOCK_LISTINGS = [
    Listing(
        name="Cardboard Boxes (Bulk)",
        image="https://images.unsplash.com/photo-1607166452427-7e4477079cb9?w=400&h=300&fit=crop",
        owner="Acme Warehousing",
        location="Austin, TX",
        quantity="200 units",
        email="acme@example.com",
        mailtolink="mailto:acme@example.com?subject=Cardboard Boxes",
        status="available",
        category="paper",
    ),
    Listing(
        name="Scrap Metal Offcuts",
        image="https://images.unsplash.com/photo-1679996287979-166522b96c39?w=400&h=300&fit=crop",
        owner="Metro Fabrication",
        location="Detroit, MI",
        quantity="1.5 tons",
        email="metro@example.com",
        mailtolink="mailto:metro@example.com?subject=Scrap Metal Offcuts",
        status="available",
        category="metal",
    ),
    Listing(
        name="Expired Produce Crates",
        image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZKYgTneAypATX8GEVxfwjiqxrf5S8qwImTuy8dC26DA&s=10",
        owner="GreenLeaf Grocers",
        location="Sacramento, CA",
        quantity="50 crates",
        email="greenleaf@example.com",
        mailtolink="mailto:greenleaf@example.com?subject=Produce Crates",
        status="available",
        category="organic",
    ),
    Listing(
        name="Wood Pallets",
        image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR015P-l3pfCMSXGVO2MlE6GlPyBfeLXNUHvs8mAgWCNpnASWom3m8Zd0Fr&s=10",
        owner="Union Logistics",
        location="Portland, OR",
        quantity="80 pallets",
        email="union@example.com",
        mailtolink="mailto:union@example.com?subject=Wood Pallets",
        status="available",
        category="wood",
        tags="wood,lumber,timber,shipping",
    ),
]

with SessionLocal() as _db:
    if _db.query(Listing).count() == 0:
        _db.add_all(MOCK_LISTINGS)
        _db.commit()


class ListingCreate(BaseModel):
    name: str
    image: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    quantity: Optional[str] = None
    email: Optional[str] = None
    mailtolink: Optional[str] = None
    status: Optional[str] = "available"
    category: Optional[str] = None
    tags: Optional[str] = None


class ListingOut(ListingCreate):
    id: int

    class Config:
        from_attributes = True


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Synonym groups: searching any term in a group also matches the rest of the group.
SYNONYM_GROUPS = [
    {"wood", "pallets", "lumber", "timber"},
    {"metal", "scrap metal", "steel", "aluminum", "offcuts"},
    {"paper", "cardboard", "boxes", "packaging"},
    {"organic", "produce", "food waste", "compost"},
    {"plastic", "polymer"},
]


def expand_query_terms(query: str) -> set[str]:
    q = query.strip().lower()
    if not q:
        return set()
    terms = {q}
    for group in SYNONYM_GROUPS:
        if q in group:
            terms |= group
    return terms


@app.get("/api/search", response_model=list[ListingOut])
def search_listings(query: str = ""):
    db = SessionLocal()
    try:
        terms = expand_query_terms(query)
        if not terms:
            return db.query(Listing).all()

        filters = []
        for term in terms:
            like = f"%{term}%"
            filters.append(Listing.name.ilike(like))
            filters.append(Listing.category.ilike(like))
            filters.append(Listing.location.ilike(like))
            filters.append(Listing.tags.ilike(like))

        results = db.query(Listing).filter(or_(*filters)).all()
        return results
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/listings", response_model=list[ListingOut] | ListingOut)
def get_listings(id: Optional[int] = None):
    db = SessionLocal()
    try:
        if id is not None:
            listing = db.query(Listing).filter(Listing.id == id).first()
            if not listing:
                raise HTTPException(status_code=404, detail="Listing not found")
            return listing
        return db.query(Listing).all()
    finally:
        db.close()


@app.post("/api/upload", response_model=ListingOut)
def create_listing(listing: ListingCreate):
    db = SessionLocal()
    try:
        new_listing = Listing(**listing.model_dump())
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)
        return new_listing
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
