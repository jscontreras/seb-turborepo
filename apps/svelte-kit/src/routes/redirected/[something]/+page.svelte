<script>
  export let params;
   const randomSlug = `${params.something}_X_`;
</script>

<h1>Welcome to /redirected/{params.something}</h1>

<p>
  <a href={`/redirect/${randomSlug}`}>Go to /redirect/{randomSlug}</a>
</p>
