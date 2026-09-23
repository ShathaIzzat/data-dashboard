import { useState } from "react";
import "./SearchBox.css";

function SearchBox({ onSearch }) {
  const [searchValue, setSearchValue] = useState("");

  function handleSearch() {
    const value = searchValue.trim();

    if (!value) {
      onSearch("");
      return;
    }

    onSearch(value);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function handleClear() {
    setSearchValue("");
    onSearch("");
  }

  return (
    <section className="search-box-section">

      <div className="search-box-section__header">
        <h2>البحث في الكشوفات</h2>

        <p>
          ابحث باستخدام الاسم أو رقم الهوية
        </p>
      </div>

      <div className="search-box">

        <div className="search-box__input-wrapper">

          <input
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب الاسم أو رقم الهوية..."
          />

          {searchValue && (
            <button
              type="button"
              className="search-box__clear"
              onClick={handleClear}
              aria-label="مسح البحث"
            >
              ✕
            </button>
          )}

        </div>

        <button
          type="button"
          className="search-box__button"
          onClick={handleSearch}
        >
          بحث
        </button>

      </div>

    </section>
  );
}

export default SearchBox;