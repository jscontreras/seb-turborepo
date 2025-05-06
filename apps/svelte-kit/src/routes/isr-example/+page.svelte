<script>
  export let data;
</script>

<h1>ISR Example</h1>
<p>This page was generated at: <strong>{data.now}</strong></p>
<p>It will be regenerated at most every <strong>{data.revalidate}</strong> seconds (ISR).</p>