from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String
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


Base.metadata.create_all(bind=engine)

MOCK_LISTINGS = [
    Listing(
        name="Cardboard Boxes (Bulk)",
        image="https://placehold.co/400x300?text=Cardboard",
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
        image="https://placehold.co/400x300?text=Scrap+Metal",
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
        image="https://placehold.co/400x300?text=Produce",
        owner="GreenLeaf Grocers",
        location="Sacramento, CA",
        quantity="50 crates",
        email="greenleaf@example.com",
        mailtolink="mailto:greenleaf@example.com?subject=Produce Crates",
        status="available",
        category="organic",
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


@app.get("/api/search", response_model=list[ListingOut])
def search_listings(query: str = ""):
    db = SessionLocal()
    try:
        like = f"%{query}%"
        results = db.query(Listing).filter(
            (Listing.name.ilike(like))
            | (Listing.category.ilike(like))
            | (Listing.location.ilike(like))
        ).all()
        return results
    finally:
        db.close()


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
