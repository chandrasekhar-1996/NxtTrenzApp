import React, {useState, useEffect} from 'react'
import {
  Switch,
  Route,
  Link,
  useHistory,
  useParams,
  useLocation,
} from 'react-router-dom'
import './App.css'

// 👇 Replace with your actual TMDB API Key
const API_KEY = 'YOUR_TMDB_API_KEY'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const PLACEHOLDER_IMG = 'https://via.placeholder.com/500x750?text=No+Image'

// ==========================================
// 1. GLOBAL NAVBAR COMPONENT
// ==========================================
const Navbar = ({searchQuery, setSearchQuery, onSearchSubmit}) => {
  const history = useHistory()
  const location = useLocation()

  const handleFormSubmit = e => {
    e.preventDefault()
    if (searchQuery.trim() !== '') {
      onSearchSubmit(searchQuery)
      history.push('/search')
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo-link">
          <h1 className="navbar-logo">movieDB</h1>
        </Link>
      </div>

      <div className="navbar-center">
        <Link
          to="/"
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Popular
        </Link>
        <Link
          to="/top-rated"
          className={`nav-link ${
            location.pathname === '/top-rated' ? 'active' : ''
          }`}
        >
          Top Rated
        </Link>
        <Link
          to="/upcoming"
          className={`nav-link ${
            location.pathname === '/upcoming' ? 'active' : ''
          }`}
        >
          Upcoming
        </Link>
      </div>

      <form className="navbar-search" onSubmit={handleFormSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Movie Name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>
    </nav>
  )
}

// ==========================================
// 2. REUSABLE MOVIE CARD COMPONENT
// ==========================================
const MovieCard = ({movie}) => {
  const {id, title, poster_path: posterPath, vote_average: voteAverage} = movie
  const imageUrl = posterPath
    ? `${IMAGE_BASE_URL}${posterPath}`
    : PLACEHOLDER_IMG

  return (
    <div className="movie-card">
      <img src={imageUrl} alt={title} className="movie-poster" />
      <div className="movie-card-body">
        <h3 className="movie-title">{title}</h3>
        <p className="movie-rating">Rating: {voteAverage?.toFixed(1)}</p>
        <Link to={`/movie/${id}`} className="view-details-link">
          <button type="button" className="view-details-btn">
            View Details
          </button>
        </Link>
      </div>
    </div>
  )
}

// ==========================================
// 3. REUSABLE PAGINATION COMPONENT
// ==========================================
const Pagination = ({page, totalPages, onPageChange}) => (
  <div className="pagination">
    <button
      type="button"
      className="page-btn"
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
    >
      Prev
    </button>
    <span className="page-number">
      {page} / {totalPages || 1}
    </span>
    <button
      type="button"
      className="page-btn"
      disabled={page >= totalPages}
      onClick={() => onPageChange(page + 1)}
    >
      Next
    </button>
  </div>
)

// ==========================================
// 4. REUSABLE MOVIES LIST PAGE
// ==========================================
const MoviesPage = ({endpoint, pageTitle, queryParam = ''}) => {
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [endpoint, queryParam])

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      setError(null)
      try {
        const queryString = queryParam
          ? `&query=${encodeURIComponent(queryParam)}`
          : ''
        const url = `${BASE_URL}${endpoint}?api_key=${API_KEY}&language=en-US${queryString}&page=${page}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch movies')
        }
        const data = await response.json()
        setMovies(data.results || [])
        setTotalPages(data.total_pages || 1)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (endpoint === '/search/movie' && !queryParam.trim()) {
      setMovies([])
      setLoading(false)
      return
    }

    fetchMovies()
  }, [endpoint, page, queryParam])

  const handlePageChange = newPage => {
    setPage(newPage)
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  return (
    <div className="page-container">
      {pageTitle && <h2 className="page-heading">{pageTitle}</h2>}

      {loading && <div className="status-msg">Loading movies...</div>}
      {error && <div className="status-msg error">Error: {error}</div>}

      {!loading && !error && movies.length === 0 && (
        <div className="status-msg">No movies found.</div>
      )}

      {!loading && !error && movies.length > 0 && (
        <>
          <div className="movies-grid">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

// ==========================================
// 5. SINGLE MOVIE DETAILS & CAST PAGE
// ==========================================
const MovieDetailsPage = () => {
  const {id} = useParams()
  const [movieDetails, setMovieDetails] = useState(null)
  const [castList, setCastList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovieAndCast = async () => {
      setLoading(true)
      setError(null)
      try {
        const [detailsRes, creditsRes] = await Promise.all([
          fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`),
          fetch(
            `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`,
          ),
        ])

        if (!detailsRes.ok || !creditsRes.ok) {
          throw new Error('Failed to fetch movie details')
        }

        const detailsData = await detailsRes.json()
        const creditsData = await creditsRes.json()

        setMovieDetails(detailsData)
        setCastList(creditsData.cast || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMovieAndCast()
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [id])

  if (loading) {
    return <div className="status-msg">Loading movie details...</div>
  }

  if (error || !movieDetails) {
    return (
      <div className="status-msg error">
        Error: {error || 'Movie not found'}
      </div>
    )
  }

  const {
    title,
    poster_path: posterPath,
    backdrop_path: backdropPath,
    vote_average: voteAverage,
    runtime,
    genres,
    release_date: releaseDate,
    overview,
  } = movieDetails

  const posterUrl = posterPath
    ? `${IMAGE_BASE_URL}${posterPath}`
    : PLACEHOLDER_IMG
  const backdropUrl = backdropPath ? `${IMAGE_BASE_URL}${backdropPath}` : ''

  return (
    <div className="details-page-container">
      {/* Movie Details Section */}
      <div
        className="movie-details-banner"
        style={
          backdropUrl
            ? {
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.75)), url(${backdropUrl})`,
              }
            : {}
        }
      >
        <div className="movie-details-content">
          <img src={posterUrl} alt={title} className="details-poster" />
          <div className="details-info">
            <h1 className="details-title">{title}</h1>
            <p className="details-rating">
              Rating: {voteAverage?.toFixed(1)} / 10
            </p>
            <div className="details-meta">
              <span className="runtime-badge">{runtime} min</span>
              <span className="genres-text">
                {genres?.map(g => g.name).join(', ')}
              </span>
            </div>
            <p className="release-date">Release Date: {releaseDate}</p>
            <h3 className="overview-heading">Overview</h3>
            <p className="overview-text">{overview}</p>
          </div>
        </div>
      </div>

      {/* Cast Details Section */}
      <div className="cast-section">
        <h2 className="section-heading">Cast</h2>
        <div className="cast-grid">
          {castList.map(member => {
            const profileUrl = member.profile_path
              ? `${IMAGE_BASE_URL}${member.profile_path}`
              : PLACEHOLDER_IMG
            return (
              <div key={member.cast_id || member.id} className="cast-card">
                <img
                  src={profileUrl}
                  alt={member.original_name}
                  className="cast-image"
                />
                <div className="cast-info">
                  <h4 className="cast-name">{member.original_name}</h4>
                  <p className="cast-character">
                    Character: {member.character}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 6. MAIN APP COMPONENT
// ==========================================
const App = () => {
  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')

  const handleSearchSubmit = query => {
    setSubmittedSearch(query)
  }

  return (
    <div className="app-wrapper">
      <Navbar
        searchQuery={searchInput}
        setSearchQuery={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <main className="main-content">
        <Switch>
          <Route exact path="/">
            <MoviesPage endpoint="/movie/popular" />
          </Route>
          <Route exact path="/top-rated">
            <MoviesPage endpoint="/movie/top_rated" />
          </Route>
          <Route exact path="/upcoming">
            <MoviesPage endpoint="/movie/upcoming" />
          </Route>
          <Route exact path="/search">
            <MoviesPage
              endpoint="/search/movie"
              pageTitle={`Search Results for "${submittedSearch}"`}
              queryParam={submittedSearch}
            />
          </Route>
          <Route exact path="/movie/:id">
            <MovieDetailsPage />
          </Route>
        </Switch>
      </main>
    </div>
  )
}

export default App
