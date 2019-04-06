// Definitions by: Jan Lohage <https://github.com/j2L4e>
/// <reference types="@feathersjs/transport-commons"/>

// primus removed its typings from the repo https://github.com/primus/primus/pull/623, as of 01/2018 there are none on DT
export default function feathersPrimus(options: any, callback?: (primus: any) => void): () => void;
