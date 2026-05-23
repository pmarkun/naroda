# Legacy — use flake.nix (nix develop)
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [ jdk17 nodejs_20 ];
}
