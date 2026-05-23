{
  description = "Na Roda — Android build toolchain";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        jdk17
        nodejs_20
      ];

      shellHook = ''
        echo ""
        echo "  Na Roda — Android Build Environment"
        echo "  JDK:  $(java -version 2>&1 | head -1)"
        echo "  Node: $(node --version)"
        echo "  npm:  $(npm --version)"
        echo ""
        echo "  Commands:"
        echo "    npx @bubblewrap/cli init --manifest <url>"
        echo "    cd android && npx @bubblewrap/cli build"
        echo ""
        echo "  On first run, Bubblewrap will ask for JDK path."
        echo "  Point it to: ${pkgs.jdk17}/lib/openjdk"
        echo ""
      '';
    };
  };
}
