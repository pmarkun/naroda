{
  description = "Na Roda — Android build toolchain";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
    bundletoolVersion = "1.18.3";
    bundletool = pkgs.stdenvNoCC.mkDerivation {
      pname = "bundletool";
      version = bundletoolVersion;
      src = pkgs.fetchurl {
        url = "https://github.com/google/bundletool/releases/download/${bundletoolVersion}/bundletool-all-${bundletoolVersion}.jar";
        hash = "sha256-oJnPoVQ/VVk7wu0Wpwp8Z/5UsXR7tzAfN/39bZECjik=";
      };
      dontUnpack = true;
      installPhase = ''
        mkdir -p $out/bin $out/share/java
        cp $src $out/share/java/bundletool.jar
        cat > $out/bin/bundletool << 'JEOF'
#!/usr/bin/env bash
exec ${pkgs.jdk17}/bin/java -jar @out@/share/java/bundletool.jar "$@"
JEOF
        substituteInPlace $out/bin/bundletool --replace "@out@" "$out"
        chmod +x $out/bin/bundletool
      '';
    };
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        jdk17
        nodejs_20
        bundletool
      ];

      shellHook = ''
        echo ""
        echo "  Na Roda — Android Build Environment"
        echo "  JDK:  $(java -version 2>&1 | head -1)"
        echo "  Node: $(node --version)"
        echo "  npm:  $(npm --version)"
        echo ""
        echo "  Commands:"
        echo "    generate-android      node generate-android.js"
        echo "    build-aab             cd android && BUBBLEWRAP_KEYSTORE_PASSWORD=naroda123 \\"
        echo "                            BUBBLEWRAP_KEY_PASSWORD=naroda123 npx @bubblewrap/cli build"
        echo "    build-apk             bundletool build-apks --bundle=android/app-release-bundle.aab \\"
        echo "                            --output=android/app.apks --ks=naroda.keystore \\"
        echo "                            --ks-pass=pass:naroda123 --ks-key-alias=naroda \\"
        echo "                            --key-pass=pass:naroda123"
        echo "    add-fingerprint       cd android && npx @bubblewrap/cli fingerprint add \\"
        echo "                            \"\$(keytool -list -v -keystore ../naroda.keystore \\"
        echo "                              -storepass naroda123 -alias naroda 2>&1 \\"
        echo "                              | grep SHA256 | head -1 | cut -d: -f2- | xargs)\""
        echo "    deploy-assetlinks     cp android/assetlinks.json /path/to/site/.well-known/"
        echo ""
        echo "  Java home: ${pkgs.jdk17}/lib/openjdk"
        echo ""
      '';
    };
  };
}
