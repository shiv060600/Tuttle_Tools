import { useState } from "react";
import { useBook } from "@/hooks/useBooks";
import { Search, BookOpen } from "lucide-react";

const formatValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return value;
};

const BookField = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-200 last:border-b-0">
    <div className="font-semibold text-gray-700">{label}:</div>
    <div className="text-gray-900">{formatValue(value)}</div>
  </div>
);

export default function BookInfoPage() {
  const [isbn, setIsbn] = useState<string>("");
  const [searchIsbn, setSearchIsbn] = useState<string | null>(null);
  const { data: book, isLoading, error } = useBook(searchIsbn);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isbn.trim()) {
      setSearchIsbn(isbn.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Search */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Information</h1>
        <p className="text-gray-600 mb-6">Search for book details by ISBN</p>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter ISBN..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!isbn.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Search
          </button>
        </form>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {!searchIsbn ? (
          // No search performed
          <div className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-xl text-gray-500 font-medium">No book searched for</p>
            <p className="text-gray-400 mt-2">Enter an ISBN above to search for book information</p>
          </div>
        ) : isLoading ? (
          // Loading state
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-gray-600">Loading book information...</span>
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-16 px-4 mt-4">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-700 font-medium mb-2">Error loading book</p>
            <p className="text-gray-500">{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
          </div>
        ) : !book ? (
          // No book found
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-xl text-gray-700 font-medium mb-2">Book not found</p>
            <p className="text-gray-500">No book found with ISBN: {searchIsbn}</p>
          </div>
        ) : (
          // Book data display
          <div className="p-6">
            <div className="mb-6 pb-4 border-b border-gray-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{book.TITLE || "Untitled"}</h1>
              <p className="text-gray-600 text-xl">ISBN: {book.ISBN || "N/A"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Product Information</h3>
                <BookField label="Product Type" value={book.PROD_TYPE} />
                <BookField label="Product Class" value={book.PROD_CLASS} />
                <BookField label="Publisher" value={book.PUBLISHER} />
                <BookField label="Sub Publisher" value={book.SUB_PUB} />
                <BookField label="Publication Date" value={book.PUB_DATE} />
                <BookField label="Publication Status" value={book.PUB_STATUS} />
                <BookField label="Season" value={book.SEAS} />
                <BookField label="IWD" value={book.IWD} />
                <BookField label="Expiration Date" value={book.EXPDATE} />
                <BookField label="Sell Off" value={book.SELLOFF} />
              </div>

              {/* Right Column */}
              <div className="space-y-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Pricing & Inventory</h3>
                <BookField label="Retail Price" value={book.RETAIL_PRICE ? `$${Number(book.RETAIL_PRICE).toFixed(2)}` : null} />
                <BookField label="Last Cost" value={book.LAST_COST ? `$${Number(book.LAST_COST).toFixed(2)}` : null} />
                <BookField label="Quantity on Hand" value={book.QTY_ON_HAND} />
                <BookField label="Quantity on Order" value={book.QTY_ON_ORDER} />
                <BookField label="IPS On Hand" value={book.IPS_ON_HAND} />
                <BookField label="IPS On Order" value={book.IPS_ON_ORDER} />
                <BookField label="Carton Quantity" value={book.CTNQTY} />
                <BookField label="Old Carton Quantity" value={book.OLD_CTN_QTY} />
                <BookField label="Min Report Quantity" value={book.MINRPTQTY} />
                <BookField label="Watch" value={book.WATCH} />
              </div>
            </div>

            {/* Categories Section */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories & Classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-0">
                  <BookField label="Web Category 1" value={book.WEBCAT1} />
                  <BookField label="Web Category 2" value={book.WEBCAT2} />
                  <BookField label="Web Category 2 Description" value={book.WEBCAT2_DESCR} />
                  <BookField label="Web Category 3" value={book.WEBCAT3} />
                  <BookField label="BISAC Code" value={book.BISAC_CODE} />
                </div>
                <div className="space-y-0">
                  <BookField label="OPC" value={book.OPC} />
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments</h3>
              <div className="space-y-0">
                <BookField label="General Comments" value={book.GENERAL_COMMENTS} />
                <BookField label="Internal Comments" value={book.INTERNAL_COMMENTS} />
                <BookField label="PO Comments" value={book.PO_COMMENTS} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
