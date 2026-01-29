export default function HomePage() {
  return (
    <div className="card">
      <p>Start with login, then upload a log file.</p>
      <ul>
        <li><a href="/login">Login</a></li>
        <li><a href="/upload">Upload</a></li>
        <li><a href="/results">Results</a></li>
      </ul>
    </div>
  );
}
