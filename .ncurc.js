module.exports = {
  // Reject only dependencies whose upgrade is empirically broken or deliberately frozen; document why.
  reject: [
    // standard-version is deprecated upstream (final release 9.5.0, May 2022). Hold it so a surprise
    // post-deprecation release is never auto-adopted by ncu; the real fix is migrating the release
    // script to the maintained fork commit-and-tag-version.
    'standard-version',
    // eslint is capped at ^9.x because neostandard@0.13.0 (latest) peer-depends on eslint ^9.0.0.
    // ncu -u ignores peer ranges and will jump this to eslint 10, which breaks `npm install`
    // outright (ERESOLVE). Bump this only alongside a neostandard release that supports eslint 10.
    'eslint'
  ]
}
