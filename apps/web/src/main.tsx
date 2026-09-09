import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
const Leadership = React.lazy(() => import('./Leadership'))
const BrandFilm = React.lazy(() => import('./BrandFilm'))
const ProductStill = React.lazy(() => import('./ProductStill'))
import './styles.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {location.pathname.replace(/\/+$/, '') === '/leadership' ? (
      <React.Suspense fallback={null}>
        <Leadership />
      </React.Suspense>
    ) : new URLSearchParams(location.search).has('product') ? (
      <React.Suspense fallback={null}>
        <ProductStill />
      </React.Suspense>
    ) : new URLSearchParams(location.search).get('film') === '1' ? (
      <React.Suspense fallback={null}>
        <BrandFilm />
      </React.Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
