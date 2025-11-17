// Static diagram chart string - extracted for better caching
// This constant is shared across all page renders and doesn't need to be re-serialized
export const ISR_FLOW_DIAGRAM = `graph TD;
    A("GET ISR with param :n /isr/:n
      with tag *isr-page-[:n]*
    ")-->B(["Fetch Lorem post with id :n
    with tag *isr-lorem-[:n]*"]);
    B-->F;
    A-->C("Fetch current date from external server hh:mm:ss
    with tag *isr-date-fetch*
    ");
    C-->D("Using the seconds :ss from external server Fetch Lorem post with id :ss
    with tag *isr-lorem-[:ss]*");
    A-->E("Get current Date() from the function");
    D-->F("Render Page");
    E-->F;`;

