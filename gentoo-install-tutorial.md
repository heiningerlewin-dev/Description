# Gentoo Linux komplett einrichten: KDE Plasma, NVIDIA, Steam, Heroic, MangoHud, GOverlay, Firefox, Audio

Zugeschnitten auf diese Hardware:

| Komponente | Wert |
| --- | --- |
| CPU | AMD Ryzen 5 7500F (Zen 4, 6 Kerne / 12 Threads, keine iGPU) |
| GPU | NVIDIA GeForce RTX 4070 SUPER |
| RAM | 32 GB |
| Datenträger | 1 TB NVMe (bisher CachyOS, btrfs) |
| Netzwerk | WLAN (wlan0) |
| Monitor | ASUS ROG 27", 1920x1080 @ 180 Hz, DisplayPort |
| Firmware | UEFI |
| Sprache | de_DE.UTF-8, deutsche Tastatur, Zeitzone Europe/Berlin |

Ziel: Gentoo mit systemd, KDE Plasma 6 auf Wayland, NVIDIA-Treiber, PipeWire-Audio (inkl. NVIDIA HDMI/DP-Audio), NetworkManager-WLAN, Firefox, Steam, Heroic Games Launcher, MangoHud, GOverlay und gamemode.

Plan: Der interaktive Teil dauert etwa 5 Stunden. Danach läuft die große Kompilierung aus den Quellen unbeaufsichtigt über Nacht. Am nächsten Tag folgt die Feineinrichtung (1 bis 2 Stunden).

Stand der Paketversionen: Oktober 2026 (stabiler Gentoo-Zweig). Die Versionen ändern sich laufend, die Befehle bleiben gleich.

| Paket | Version (stabil, amd64) |
| --- | --- |
| Profil | default/linux/amd64/23.0/desktop/plasma/systemd |
| Kernel | sys-kernel/gentoo-kernel-bin 6.18.54 (LTS) |
| NVIDIA | x11-drivers/nvidia-drivers 595.104.02 (offenes Kernelmodul, immer) |
| Plasma | kde-plasma/plasma-meta 6.7.5 |
| Firefox | www-client/firefox 153.4.0 (ESR) |
| PipeWire | media-video/pipewire 1.6.8 |
| GCC | sys-devel/gcc 15.3.0 (kennt -march=znver4) |
| Steam | games-util/steam-launcher 1.0.0.87 (steam-overlay, ~amd64) |
| Heroic | games-util/heroic-bin 2.22.3 (::gentoo, ~amd64) |
| MangoHud | games-util/mangohud 0.8.4 (GURU-Overlay, ~amd64) |
| gamemode | games-util/gamemode 1.8.2 |

---

## 0. Zeitplan und Annahmen

### Zeitplan

| Phase | Dauer | Inhalt |
| --- | --- | --- |
| A1 Vorbereitung | 30 min | Backup, Live-USB erstellen, BIOS prüfen |
| A2 Live-System, Netz, Partitionen | 30 min | Booten, WLAN, Platte einrichten |
| A3 Stage3 und make.conf | 30 min | Grundsystem entpacken, Portage konfigurieren |
| A4 Chroot: Profil, Locale, Kernel, Bootloader, Netzwerk | 90 min | Binär-Kernel, Firmware, GRUB, systemd, NetworkManager |
| A5 NVIDIA-Treiber, erster Reboot | 60 min | Treiber bauen (zieht LLVM mit, ~40 min), booten, WLAN testen |
| A6 Nacht-Job vorbereiten und starten | 45 min | Overlays, USE-Flags, Set anlegen, Testlauf, starten |
| B Nacht | 6 bis 10 h | Plasma, Firefox, Steam-32-Bit, MangoHud, Heroic aus den Quellen |
| C Nächster Tag | 1 bis 2 h | SDDM, Plasma, 180 Hz, Audio, Steam, Heroic, MangoHud, GOverlay |

### Annahmen

- Die komplette NVMe wird neu partitioniert. CachyOS und alle Daten darauf werden gelöscht. Vorher Backup machen.
- systemd statt OpenRC. Für Plasma 6 und einen Umsteiger von CachyOS ist das der reibungsloseste Weg.
- Dateisystem btrfs mit Subvolumes, wie bisher unter CachyOS.
- Bootloader GRUB im UEFI-Modus.
- Kernel zunächst der fertige Binär-Kernel von Gentoo (gentoo-kernel-bin). Das spart beim ersten Durchlauf eine Stunde. Der Quellcode-Kernel kommt optional in einer zweiten Nacht (Abschnitt 11).
- Rust und Firefox-Toolchain: Rust kommt als fertiges Binary (dev-lang/rust-bin, Gentoo-Standard). Alles andere (Plasma, Qt, Firefox, LLVM, Mesa, Steam-Abhängigkeiten, MangoHud) wird aus den Quellen gebaut.
- GOverlay kommt als Flatpak. Die Gentoo-Version im GURU-Overlay ist 1.2 und damit Jahre alt (aktuell ist 1.9.x).

### Namen in diesem Tutorial

| Platzhalter | Bedeutung |
| --- | --- |
| `/dev/nvme0n1` | die NVMe (mit `lsblk` prüfen) |
| `lewin` | der normale Benutzer (frei wählbar) |
| `gentoo-pc` | der Hostname (frei wählbar) |

---

## 1. Vorbereitung (noch unter CachyOS)

### 1.1 Daten sichern

Alles Wichtige aus `/home` auf eine externe Platte oder in die Cloud. Savegames liegen oft unter `~/.local/share/Steam/steamapps/compatdata` und `~/.config`. Die WLAN-Zugangsdaten lassen sich mitnehmen:

```bash
sudo ls /etc/NetworkManager/system-connections/
```

### 1.2 Hardware-Infos notieren

```bash
lsblk -o NAME,SIZE,MODEL,FSTYPE,MOUNTPOINT
lspci -nnk | grep -A3 -Ei 'network|wireless'
lspci -nnk | grep -A3 -i audio
```

Notiere dir:

- den Gerätenamen der NVMe (normalerweise `/dev/nvme0n1`)
- den WLAN-Chip und den Treiber in der Zeile `Kernel driver in use:` (typisch: `mt7921e` für MediaTek MT7921/MT7922, `iwlwifi` für Intel AX210/BE200, `rtw89_8852be` für Realtek RTL8852BE)
- SSID und WLAN-Passwort

Alle diese Chips werden vom Gentoo-Kernel und von `sys-kernel/linux-firmware` unterstützt.

### 1.3 BIOS/UEFI einstellen

Beim Start Entf oder F2 drücken:

- Secure Boot: aus (die NVIDIA-Kernelmodule sind nicht signiert)
- CSM / Legacy Boot: aus (reiner UEFI-Modus)
- Resizable BAR / Above 4G Decoding: an
- EXPO-Profil für den RAM: an
- Bootmenü beim Start: F8 (ASUS), F11 (MSI) oder F12 (Gigabyte)

### 1.4 Live-USB erstellen

Zwei Wege, beide funktionieren:

**Option A: Gentoo LiveGUI (empfohlen).** KDE-Plasma-Oberfläche, NetworkManager für WLAN, Firefox zum Nachlesen, alle Gentoo-Werkzeuge vorinstalliert. Download: https://www.gentoo.org/downloads/ , Abschnitt "LiveGUI USB Image" (amd64, ca. 4 GB).

**Option B: der CachyOS-Live-USB.** Funktioniert auf dieser Hardware nachweislich (WLAN, NVIDIA). Die Installation läuft dann über `chroot` genauso, nur zwei Befehle sind anders (siehe Abschnitt 4.2 und 5.1).

USB-Stick beschreiben (Stick ist hier `/dev/sdX`, mit `lsblk` prüfen, alle Daten darauf gehen verloren):

```bash
sudo dd if=livegui-amd64-*.iso of=/dev/sdX bs=4M status=progress oflag=sync
```

Alternativ geht der KDE ISO Image Writer oder Ventoy.

---

## 2. Live-System starten, Netzwerk, Uhrzeit

1. Vom USB-Stick booten, im Bootmenü den UEFI-Eintrag wählen (nicht "Legacy").
2. LiveGUI: Falls nach einer Tastaturbelegung gefragt wird, `de` wählen. Es startet Plasma mit dem Benutzer `gentoo`.
3. Unten rechts über das Netzwerk-Symbol mit dem WLAN verbinden.
4. Konsole öffnen und Root werden (ohne Passwort):

```bash
sudo su -
```

5. Prüfen:

```bash
ping -c 3 gentoo.org
date
ls /sys/firmware/efi/efivars | head -3
```

Die letzte Zeile muss Dateien anzeigen, sonst wurde nicht im UEFI-Modus gebootet.

Falls die Uhrzeit abweicht (sonst scheitern Signaturprüfungen):

```bash
chronyd -q
```

Auf dem CachyOS-USB stattdessen `timedatectl` prüfen, dort läuft die Zeitsynchronisation automatisch.

6. Deutsche Tastatur in der Konsole, falls nötig:

```bash
loadkeys de-latin1
```

Falls das LiveGUI mit der RTX 4070 SUPER keinen Desktop zeigt: im Bootmenü `nomodeset` anhängen oder Option B (CachyOS-USB) nehmen. WLAN per Konsole geht dort mit `nmtui`.

---

## 3. Partitionieren und Dateisysteme (etwa 15 min)

### 3.1 Layout

| Partition | Größe | Typ | Dateisystem | Mountpunkt |
| --- | --- | --- | --- | --- |
| `/dev/nvme0n1p1` | 1 GiB | EFI System | FAT32 | `/efi` |
| `/dev/nvme0n1p2` | 16 GiB | Linux swap | swap | - |
| `/dev/nvme0n1p3` | Rest (~914 GiB) | Linux root (x86-64) | btrfs | `/` und `/home` als Subvolumes |

16 GiB Swap entsprechen der Handbuch-Empfehlung für 32 GB RAM ohne Ruhezustand und sind ein Puffer, wenn nachts Firefox und LLVM parallel gebaut werden.

### 3.2 Partitionieren mit fdisk

```bash
fdisk /dev/nvme0n1
```

Tastenfolge in fdisk (jeweils mit Enter bestätigen):

```text
g                      neue GPT-Partitionstabelle (löscht alles)
n  1  Enter  +1G       Partition 1, 1 GiB
t  1  1                Typ: EFI System
n  2  Enter  +16G      Partition 2, 16 GiB
t  2  19               Typ: Linux swap
n  3  Enter  Enter     Partition 3, Rest
t  3  23               Typ: Linux root (x86-64)
p                      Ergebnis prüfen
w                      schreiben und beenden
```

### 3.3 Dateisysteme anlegen

```bash
mkfs.vfat -F 32 -n EFI /dev/nvme0n1p1
mkswap -L swap /dev/nvme0n1p2
mkfs.btrfs -L gentoo /dev/nvme0n1p3
```

### 3.4 btrfs-Subvolumes und Mounten

```bash
mkdir -p /mnt/gentoo
mount /dev/nvme0n1p3 /mnt/gentoo
btrfs subvolume create /mnt/gentoo/@
btrfs subvolume create /mnt/gentoo/@home
umount /mnt/gentoo

mount -o subvol=@,noatime,compress=zstd:1 /dev/nvme0n1p3 /mnt/gentoo
mkdir -p /mnt/gentoo/home /mnt/gentoo/efi
mount -o subvol=@home,noatime,compress=zstd:1 /dev/nvme0n1p3 /mnt/gentoo/home
mount /dev/nvme0n1p1 /mnt/gentoo/efi
swapon /dev/nvme0n1p2
```

Prüfen:

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
```

SSD-Optimierungen und TRIM (`discard=async`) aktiviert btrfs auf aktuellen Kerneln automatisch.

---

## 4. Stage3 entpacken und Portage konfigurieren (etwa 30 min)

### 4.1 Stage3 herunterladen

Gentoo bietet fertige "desktop"-Stage3-Archive mit systemd an. Darin sind die Desktop-USE-Flags schon gesetzt, beim späteren Profilwechsel muss weniger neu gebaut werden.

```bash
cd /mnt/gentoo
BASE=https://distfiles.gentoo.org/releases/amd64/autobuilds
STAGE=$(curl -s $BASE/current-stage3-amd64-desktop-systemd/latest-stage3-amd64-desktop-systemd.txt | grep -m1 'stage3-amd64-desktop-systemd' | awk '{print $1}')
echo "$STAGE"
wget "$BASE/$STAGE" "$BASE/$STAGE.asc" "$BASE/$STAGE.sha256"
ls -la
```

`echo "$STAGE"` muss etwa `20261005T163057Z/stage3-amd64-desktop-systemd-20261005T163057Z.tar.xz` ausgeben. Falls nicht: Im Browser https://www.gentoo.org/downloads/ öffnen, bei "Stage archives" den Eintrag "amd64, desktop profile | systemd" wählen und die Datei samt `.asc` und `.sha256` nach `/mnt/gentoo` speichern.

### 4.2 Prüfen und entpacken

Schlüssel importieren, auf dem LiveGUI:

```bash
gpg --import /usr/share/openpgp-keys/gentoo-release.asc
```

Auf dem CachyOS-USB stattdessen:

```bash
gpg --keyserver hkps://keys.gentoo.org --recv-keys 13EBBDBEDE7A12775DFDB1BABB572E0E2D182910
```

Signatur und Prüfsumme prüfen, dann entpacken:

```bash
cd /mnt/gentoo
gpg --verify stage3-*.tar.xz.asc stage3-*.tar.xz
gpg --output stage3.sha256.verified --verify stage3-*.tar.xz.sha256
sha256sum --check stage3.sha256.verified

tar xpvf stage3-*.tar.xz --xattrs-include='*.*' --numeric-owner -C /mnt/gentoo
```

Bei `gpg --verify` muss `Good signature from "Gentoo Linux Release Engineering (Automated Weekly Release Key)"` erscheinen. Die Warnung "not certified with a trusted signature" ist normal.

### 4.3 make.conf für den Ryzen 5 7500F

```bash
nano /mnt/gentoo/etc/portage/make.conf
```

Inhalt (komplett ersetzen):

```bash
# Compiler-Flags: -march=native entspricht auf dieser CPU -march=znver4 (Zen 4)
COMMON_FLAGS="-O2 -pipe -march=native"
CFLAGS="${COMMON_FLAGS}"
CXXFLAGS="${COMMON_FLAGS}"
FCFLAGS="${COMMON_FLAGS}"
FFLAGS="${COMMON_FLAGS}"

# 12 Threads, Lastgrenze 12; zwei Pakete gleichzeitig, solange die Last unter 12 bleibt
MAKEOPTS="-j12 -l12"
EMERGE_DEFAULT_OPTS="--jobs=2 --load-average=12"

# Hardware: nur NVIDIA, keine iGPU
VIDEO_CARDS="nvidia"
INPUT_DEVICES="libinput"
GRUB_PLATFORMS="efi-64"

# dist-kernel: NVIDIA-Modul wird bei Kernel-Updates automatisch neu gebaut
# -webengine: haelt dev-qt/qtwebengine (mehrere Stunden Bauzeit) fern
USE="dist-kernel -webengine"

# Sprache (Firefox-Sprachpaket, Woerterbuecher). KDE installiert alle Sprachen sowieso.
L10N="de"
LC_MESSAGES=C.UTF-8

# Lizenzen: NVIDIA-Treiber und Firmware (@BINARY-REDISTRIBUTABLE), Steam (ValveSteamLicense)
ACCEPT_LICENSE="@FREE @BINARY-REDISTRIBUTABLE ValveSteamLicense"

# Logs fuer den unbeaufsichtigten Nacht-Lauf
FEATURES="split-log split-elog"
PORTAGE_LOGDIR="/var/log/portage"
PORTAGE_ELOG_CLASSES="log warn error"
PORTAGE_ELOG_SYSTEM="save echo"
```

Hinweise:

- `MAKEOPTS="-j12"` ist mit 32 GB RAM sicher (Faustregel: das Kleinere aus Threads und RAM/2 GB).
- `CPU_FLAGS_X86` wird in Abschnitt 5.4 automatisch ermittelt.
- Das Profil setzt Flags wie `wayland`, `pipewire`, `pulseaudio`, `vulkan`, `X`, `bluetooth` und `networkmanager` bereits global. `pulseaudio` bedeutet auf Gentoo nur "PulseAudio-Client-Bibliothek", den Sound-Server stellt PipeWire.
- Ein deutscher Mirror ist optional, das Standard-CDN ist schnell. Wer will: `emerge --ask --oneshot app-portage/mirrorselect && mirrorselect -i -o >> /etc/portage/make.conf` (im chroot).

---

## 5. Chroot und Grundsystem (etwa 90 min)

### 5.1 In das neue System wechseln

```bash
cp --dereference /etc/resolv.conf /mnt/gentoo/etc/

mount --types proc /proc /mnt/gentoo/proc
mount --rbind /sys /mnt/gentoo/sys
mount --make-rslave /mnt/gentoo/sys
mount --rbind /dev /mnt/gentoo/dev
mount --make-rslave /mnt/gentoo/dev
mount --bind /run /mnt/gentoo/run
mount --make-slave /mnt/gentoo/run

chroot /mnt/gentoo /bin/bash
source /etc/profile
export PS1="(chroot) ${PS1}"
```

Vom CachyOS-USB aus lautet die chroot-Zeile stattdessen:

```bash
chroot /mnt/gentoo /bin/env -i TERM=$TERM /bin/bash
env-update && source /etc/profile && export PS1="(chroot) ${PS1}"
```

Ab hier läuft alles im chroot. Falls du die Konsole schließt oder neu startest, Abschnitt 3.4 (Mounten) und 5.1 wiederholen.

### 5.2 Portage-Baum holen

```bash
emerge-webrsync
emerge --sync --quiet
eselect news read
```

`eselect news read` zeigt wichtige Hinweise zu Änderungen. Kurz überfliegen.

### 5.3 Profil setzen

```bash
eselect profile set default/linux/amd64/23.0/desktop/plasma/systemd
eselect profile show
```

### 5.4 CPU-Flags ermitteln

```bash
emerge --ask --oneshot app-portage/cpuid2cpuflags
cpuid2cpuflags > /etc/portage/package.use/00cpu-flags
cat /etc/portage/package.use/00cpu-flags
```

Die Ausgabe beginnt bereits mit `*/* CPU_FLAGS_X86:` und enthält für den Zen 4 unter anderem `avx512f avx512bw avx512vl avx512_bf16 aes sha sse4a`.

### 5.5 Zeitzone, Sprache, Tastatur, Hostname

```bash
ln -sf ../usr/share/zoneinfo/Europe/Berlin /etc/localtime

cat >> /etc/locale.gen <<'EOF'
de_DE.UTF-8 UTF-8
en_US.UTF-8 UTF-8
EOF
locale-gen
eselect locale set de_DE.utf8
echo 'LANG=de_DE.UTF-8' > /etc/locale.conf
env-update && source /etc/profile && export PS1="(chroot) ${PS1}"

echo 'KEYMAP=de-latin1' > /etc/vconsole.conf
echo 'gentoo-pc' > /etc/hostname
cat > /etc/hosts <<'EOF'
127.0.0.1   localhost
::1         localhost
127.0.1.1   gentoo-pc.localdomain gentoo-pc
EOF
```

### 5.6 Welt aktualisieren (optional jetzt, sonst nachts)

Der Profilwechsel und die CPU-Flags ändern einige USE-Flags. Schau, wie viel Portage neu bauen will:

```bash
emerge --pretend --update --deep --newuse @world | tail -5
```

Sind es unter etwa 40 Pakete, jetzt bauen (15 bis 40 Minuten):

```bash
emerge --ask --verbose --update --deep --newuse @world
```

Sind es deutlich mehr, überspringen. Der Nacht-Job (Abschnitt 7) macht diesen Schritt als Erstes.

### 5.7 Firmware und Binär-Kernel

Festlegen, dass der Kernel-Installer dracut (Initramfs) und GRUB (Menü-Update) nutzt. Das Flag `systemd` kommt vom Profil:

```bash
mkdir -p /etc/portage/package.use
cat > /etc/portage/package.use/kernel <<'EOF'
sys-kernel/installkernel dracut grub
EOF
emerge --ask sys-kernel/installkernel sys-kernel/linux-firmware
```

`linux-firmware` bringt WLAN-Firmware, AMD-Microcode und Audio-Firmware mit (ca. 1 GB). Dann den Binär-Kernel:

```bash
emerge --ask sys-kernel/gentoo-kernel-bin
```

Das zieht `sys-kernel/dracut` und `sys-boot/grub` mit, baut das Initramfs (mit AMD-Microcode) und schreibt den Kernel nach `/boot`. Prüfen:

```bash
ls -la /boot
eselect kernel list
```

In `/boot` liegen `kernel-6.18.54-gentoo-dist-bin` und `initramfs-6.18.54-gentoo-dist-bin.img` (Versionsnummer variiert). Die Datei heißt mit systemd `kernel-*`, nicht `vmlinuz-*`.

Falls der Kernel-Installer mit "Dracut will be run from inside a chroot but no cmdline for dracut was configured" abbricht (passiert nur mit älterem dracut):

```bash
echo 'hostonly_cmdline="no"' > /etc/dracut.conf.d/10-chroot.conf
emerge --config sys-kernel/gentoo-kernel-bin
```

### 5.8 fstab

UUIDs auslesen:

```bash
blkid -s UUID -o value /dev/nvme0n1p1
blkid -s UUID -o value /dev/nvme0n1p2
blkid -s UUID -o value /dev/nvme0n1p3
```

`/etc/fstab` schreiben (die drei UUIDs einsetzen):

```bash
nano /etc/fstab
```

```text
# <Gerät>                                     <Mountpunkt>  <Typ>   <Optionen>                              <dump> <pass>
UUID=UUID-VON-P3                              /             btrfs   subvol=@,noatime,compress=zstd:1        0      0
UUID=UUID-VON-P3                              /home         btrfs   subvol=@home,noatime,compress=zstd:1    0      0
UUID=UUID-VON-P1                              /efi          vfat    umask=0077                              0      2
UUID=UUID-VON-P2                              none          swap    sw                                      0      0
```

Tipp gegen Tippfehler: `blkid >> /etc/fstab` und die Zeilen dann in nano umbauen.

### 5.9 Netzwerk: NetworkManager mit WLAN

```bash
cat > /etc/portage/package.use/network <<'EOF'
# wext ist die veraltete WLAN-API, fuer mt7921e/iwlwifi/rtw89 nicht noetig
net-misc/networkmanager -wext
EOF
emerge --ask net-misc/networkmanager net-wireless/iw net-wireless/wireless-regdb
```

`wireless-regdb` liefert die Regulierungsdatenbank, ohne die 5-GHz- und 6-GHz-Kanäle eingeschränkt sein können. wpa_supplicant kommt automatisch mit und wird von NetworkManager per D-Bus gestartet.

### 5.10 systemd einrichten

```bash
systemd-machine-id-setup
systemctl preset-all --preset-mode=enable-only
systemctl disable systemd-networkd.service systemd-networkd-wait-online.service
systemctl enable NetworkManager.service systemd-timesyncd.service
systemctl is-enabled NetworkManager systemd-networkd systemd-timesyncd
```

`preset-all` aktiviert auch systemd-networkd. Das muss wieder aus, sonst konkurriert es mit NetworkManager und `networkd-wait-online` blockiert jeden Start bis zu zwei Minuten. Die letzte Zeile muss `enabled`, `disabled`, `enabled` ausgeben. Eine Meldung, dass systemd nicht läuft (PID 1), ist im chroot normal.

### 5.11 Werkzeuge, sudo, Benutzer

```bash
emerge --ask app-admin/sudo app-misc/tmux sys-fs/btrfs-progs sys-fs/dosfstools \
  app-portage/gentoolkit app-portage/genlop app-portage/portage-utils app-portage/elogv \
  app-eselect/eselect-repository dev-vcs/git sys-apps/pciutils sys-apps/usbutils \
  app-shells/bash-completion
```

Root-Passwort und Benutzer:

```bash
passwd
useradd -m -G users,wheel,audio,video,usb,plugdev -s /bin/bash lewin
passwd lewin
```

`video` ist für die NVIDIA-Gerätedateien nötig, `plugdev` erlaubt das Ändern von WLAN-Verbindungen ohne Root-Passwort.

sudo für die Gruppe wheel freischalten:

```bash
EDITOR=nano visudo
```

Die Zeile `# %wheel ALL=(ALL:ALL) ALL` suchen und das `#` am Anfang entfernen.

### 5.12 GRUB installieren

```bash
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=Gentoo
grub-mkconfig -o /boot/grub/grub.cfg
```

Die Ausgabe von `grub-mkconfig` muss eine Zeile `Found linux image: /boot/kernel-6.18.54-gentoo-dist-bin` und eine mit `Found initrd image` enthalten. Die btrfs-Subvolume-Option (`rootflags=subvol=@`) setzt GRUB automatisch.

Falls das Mainboard den Eintrag "vergisst" (manche UEFI-Firmware bootet nur den Standardpfad), zusätzlich:

```bash
grub-install --target=x86_64-efi --efi-directory=/efi --removable
```

Bei der Fehlermeldung "Read-only file system" oder "EFI variables are not supported":

```bash
mount -o remount,rw,nosuid,nodev,noexec --types efivarfs efivarfs /sys/firmware/efi/efivars
```

### 5.13 NVIDIA-Treiber

Der stabile Treiber 595 baut immer das offene Kernelmodul (ein USE-Flag `kernel-open` gibt es seit 595 nicht mehr). Die RTX 4070 SUPER wird davon voll unterstützt. `nvidia-drm.modeset=1` und `fbdev=1` sind Treiber-Standard, es müssen keine Kernel-Parameter gesetzt werden. Durch `USE="dist-kernel"` in der make.conf wird das Modul bei Kernel-Updates automatisch neu gebaut.

Für den ersten Test bauen wir nur die 64-Bit-Variante ohne das GTK-Werkzeug nvidia-settings. Die 32-Bit-Bibliotheken für Steam und nvidia-settings kommen in der Nacht dazu (Abschnitt 7.3).

```bash
cat > /etc/portage/package.use/nvidia <<'EOF'
x11-drivers/nvidia-drivers -tools
EOF
emerge --ask x11-drivers/nvidia-drivers
```

Das zieht Mesa und LLVM 22 als Abhängigkeiten mit (LLVM braucht etwa 40 Minuten, wird später sowieso für Firefox gebraucht). Das Modul selbst ist in wenigen Minuten gebaut. Der Treiber installiert `/etc/modprobe.d/nvidia.conf` selbst (Blacklist für nouveau, Suspend-Optionen). Diese Datei nicht bearbeiten.

Ein Punkt für später: dracut nimmt die NVIDIA-Module beim Bauen des Initramfs mit, weil sie zur GPU passen. Nach jedem Treiber-Update müssten dann Initramfs und Treiber zusammenpassen. Einfacher: die Module aus dem Initramfs heraushalten, sie werden nach dem Boot vom laufenden System geladen:

```bash
cat > /etc/dracut.conf.d/90-nvidia.conf <<'EOF'
omit_drivers+=" nvidia nvidia-drm nvidia-modeset nvidia-uvm nvidia-peermem "
EOF
emerge --config sys-kernel/gentoo-kernel-bin
```

Der letzte Befehl baut Initramfs und GRUB-Menü neu.

### 5.14 Chroot verlassen und neu starten

```bash
exit
cd /
umount -l /mnt/gentoo/dev{/shm,/pts,}
umount -R /mnt/gentoo
swapoff /dev/nvme0n1p2
reboot
```

USB-Stick abziehen, sobald der Bildschirm schwarz wird. Im GRUB-Menü erscheint "Gentoo".

---

## 6. Erster Start und Funktionstest (etwa 20 min)

Nach dem Boot erscheint ein Text-Login. Als `lewin` anmelden.

### 6.1 WLAN verbinden

```bash
sudo nmtui
```

"Activate a connection" wählen, das WLAN auswählen, Passwort eingeben. Oder direkt:

```bash
sudo nmcli device wifi rescan
sudo nmcli --ask device wifi connect "DEINE-SSID"
ping -c 3 gentoo.org
```

Falls kein WLAN-Gerät erscheint:

```bash
nmcli device status
lspci -nnk | grep -A3 -Ei 'network|wireless'
sudo dmesg | grep -iE 'firmware|mt7921|iwlwifi|rtw89|cfg80211'
```

Eine Zeile wie `Direct firmware load for ... failed with error -2` bedeutet: Firmware fehlt. Dann prüfen, ob `sys-kernel/linux-firmware` installiert ist (`qlist -I linux-firmware`).

### 6.2 NVIDIA prüfen

```bash
lsmod | grep nvidia
nvidia-smi
cat /sys/module/nvidia_drm/parameters/modeset /sys/module/nvidia_drm/parameters/fbdev
```

`nvidia-smi` muss die RTX 4070 SUPER und die Treiberversion anzeigen, die letzte Zeile zweimal `Y`.

Wenn `lsmod` nichts zeigt:

```bash
sudo dmesg | grep -iE 'nvidia|nvrm'
```

Steht dort `Key was rejected by service` oder `unsigned module loading is restricted`, ist Secure Boot noch aktiv. Im UEFI abschalten.

### 6.3 Tastatur für Login-Bildschirm und Plasma

```bash
sudo localectl set-x11-keymap de pc105
sudo localectl status
```

Ohne diese Zeile bliebe der SDDM-Login-Bildschirm auf US-Belegung. Wer keine Akzent-Tasten will, nimmt `de pc105 nodeadkeys`.

### 6.4 Microcode und CPU-Treiber

```bash
sudo dmesg | grep -i microcode
cat /sys/devices/system/cpu/amd_pstate/status
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_driver
```

Erwartet: `active` und `amd-pstate-epp`. Dann läuft der Zen 4 im richtigen Energiemodus ohne weitere Kernel-Parameter.

---

## 7. Nacht-Job vorbereiten (etwa 45 min)

Alles Folgende als Root in einer tmux-Sitzung, damit nichts verloren geht, wenn das Terminal abbricht:

```bash
sudo -i
tmux new -s nacht
```

tmux verlassen ohne zu beenden: `Strg+b`, dann `d`. Wieder anhängen: `tmux attach -t nacht`.

### 7.1 Overlays hinzufügen

Steam liegt im Steam-Overlay, MangoHud im GURU-Overlay:

```bash
eselect repository enable steam-overlay
eselect repository enable guru
emaint sync -r steam-overlay
emaint sync -r guru
```

Das Steam-Overlay wird laut Ankündigung vom Oktober 2026 demnächst in das Haupt-Repository überführt. Prüfen, ob `games-util/steam-launcher` schon dort liegt:

```bash
emerge --search steam-launcher | grep -E 'steam-launcher|Latest'
```

Zeigt die Ausgabe eine Version aus `::gentoo`, kann das Overlay weggelassen werden.

### 7.2 Keywords für Pakete, die noch nicht stabil sind

```bash
cat > /etc/portage/package.accept_keywords/gaming <<'EOF'
# Steam (Overlay) und seine zwei Helfer
games-util/steam-launcher ~amd64
games-util/game-device-udev-rules ~amd64
sys-libs/libudev-compat ~amd64
# Heroic (::gentoo, noch testing)
games-util/heroic-bin ~amd64
# MangoHud und seine Abhaengigkeiten (GURU, alles testing)
games-util/mangohud ~amd64
media-libs/imgui ~amd64
media-libs/implot ~amd64
EOF
```

Den NVIDIA-Treiber nicht auf `~amd64` setzen, sonst landet man im Feature-Zweig 615.

### 7.3 USE-Flags für Desktop und Gaming

```bash
cat > /etc/portage/package.use/nvidia <<'EOF'
# 32-Bit-Bibliotheken fuer Steam/Proton, nvidia-settings
x11-drivers/nvidia-drivers abi_x86_32 tools
media-libs/libglvnd abi_x86_32
media-libs/mesa abi_x86_32
media-libs/vulkan-loader abi_x86_32
media-libs/vulkan-layers abi_x86_32
gui-libs/egl-gbm abi_x86_32
gui-libs/egl-wayland abi_x86_32
gui-libs/egl-wayland2 abi_x86_32
gui-libs/egl-x11 abi_x86_32
x11-libs/libX11 abi_x86_32
x11-libs/libXext abi_x86_32
x11-libs/libdrm abi_x86_32
EOF

cat > /etc/portage/package.use/plasma <<'EOF'
# Plasma: Discover mit Flatpak-Backend, kein Absturz-Reporter (zieht gdb), keine Firewall-Oberflaeche
kde-plasma/plasma-meta discover flatpak -crash-handler -firewall
kde-plasma/discover flatpak
kde-plasma/kdeplasma-addons -webengine
kde-plasma/plasma-nm -openconnect
# Flatpak-Portale (Heroic, GOverlay)
sys-apps/xdg-desktop-portal flatpak seccomp
EOF

cat > /etc/portage/package.use/audio <<'EOF'
media-video/pipewire sound-server pipewire-alsa extra
# 32-Bit-PulseAudio-Client fuer Steam
media-libs/libpulse abi_x86_32
EOF

cat > /etc/portage/package.use/firefox <<'EOF'
# GPU-Rendering erzwingen, PipeWire fuer Bildschirmfreigabe, ohne Telemetrie
www-client/firefox hwaccel system-pipewire -telemetry
EOF

cat > /etc/portage/package.use/gaming <<'EOF'
# MangoHud in 32- und 64-Bit, mit Wayland-Unterstuetzung; mangoplot wuerde matplotlib ziehen
games-util/mangohud abi_x86_32 wayland -mangoplot
dev-libs/spdlog abi_x86_32
dev-libs/libfmt abi_x86_32
media-libs/imgui abi_x86_32
media-libs/implot abi_x86_32
x11-libs/libxkbcommon abi_x86_32
sys-apps/dbus abi_x86_32
dev-libs/wayland abi_x86_32
# Steam-Helfer
media-libs/fontconfig abi_x86_32
sys-libs/libudev-compat abi_x86_32
EOF
```

Zur Einordnung: `abi_x86_32` baut eine Bibliothek zusätzlich in 32 Bit. Das Steam-Client ist 32-Bit, Proton braucht 32-Bit-Vulkan. Portage fragt in 7.5 nach weiteren Flags, die hier noch fehlen.

RAM-Sicherung für die größten Pakete (zwei parallele Jobs mit je 12 Threads könnten 32 GB sprengen):

```bash
mkdir -p /etc/portage/env
cat > /etc/portage/env/lowjobs.conf <<'EOF'
MAKEOPTS="-j8 -l10"
EOF
cat > /etc/portage/package.env <<'EOF'
www-client/firefox lowjobs.conf
llvm-core/llvm lowjobs.conf
llvm-core/clang lowjobs.conf
dev-qt/qtwebengine lowjobs.conf
EOF
```

### 7.4 Paket-Set anlegen

Ein eigenes Set bündelt alles, was nachts gebaut werden soll:

```bash
mkdir -p /etc/portage/sets
cat > /etc/portage/sets/desktop-gaming <<'EOF'
# KDE Plasma (zieht kwin, sddm, plasma-nm, plasma-pa, bluedevil, xdg-desktop-portal-kde, spectacle, Schriften)
kde-plasma/plasma-meta
kde-apps/konsole
kde-apps/dolphin
kde-apps/kate
kde-apps/ark
kde-apps/gwenview
kde-apps/okular
kde-apps/kcalc
kde-apps/kwalletmanager
kde-apps/filelight
media-fonts/dejavu
media-fonts/liberation-fonts
# Audio und Bluetooth
media-video/pipewire
media-video/wireplumber
media-sound/alsa-utils
sys-auth/rtkit
net-wireless/bluez
# Browser
www-client/firefox
app-dicts/myspell-de
# Gaming
games-util/steam-launcher
games-util/heroic-bin
games-util/mangohud
games-util/gamemode
dev-util/vulkan-tools
x11-apps/mesa-progs
gnome-extra/zenity
sys-apps/flatpak
# Energieprofile in Plasma, Sensoren
sys-power/power-profiles-daemon
sys-apps/lm-sensors
EOF
```

GOverlay fehlt hier absichtlich, es kommt als Flatpak (Abschnitt 10.3).

### 7.5 Testlauf: fehlende USE-Flags automatisch ergänzen

```bash
emerge --ask --verbose --update --deep --newuse @world @desktop-gaming
```

Portage rechnet alles durch. Zwei mögliche Ergebnisse:

- Es erscheint "The following USE changes are necessary to proceed" und die Frage "Would you like to add these changes to your config files?". Mit `Yes` antworten. Portage schreibt die Änderungen als `._cfg`-Datei und beendet sich. Dann:

```bash
dispatch-conf
```

Bei jeder angezeigten Datei `u` (use new) drücken. Danach den Emerge-Befehl erneut starten. Typisch sind zwei bis drei Durchgänge, weil Steam viele Bibliotheken in 32 Bit braucht.

- Es erscheint die Paketliste und die Frage "Would you like to merge these packages?". Jetzt mit `No` antworten, erst prüfen:

Die Liste nach Zeitfressern absuchen:

```bash
emerge --pretend --verbose --update --deep --newuse @world @desktop-gaming 2>&1 | tee /root/pretend.log
grep -c '^\[ebuild' /root/pretend.log
grep -iE 'qtwebengine|llvm-core' /root/pretend.log
```

Erwartet: etwa 600 bis 900 Pakete, kein `dev-qt/qtwebengine`, LLVM nur im Slot 22 (einmal 64-Bit mit `ABI_X86="32*"` für die 32-Bit-Variante, dazu clang und lld). Taucht `qtwebengine` doch auf, zeigt `equery depends dev-qt/qtwebengine`, wer es zieht.

Eine Meldung über Lizenzen darf nicht mehr kommen, dafür sorgt `ACCEPT_LICENSE` in der make.conf. Eine Meldung über "masked by: ~amd64 keyword" bedeutet: Paket in 7.2 nachtragen.

### 7.6 Alles vorab herunterladen (15 bis 30 min)

```bash
emerge --fetchonly --update --deep --newuse @world @desktop-gaming
du -sh /var/cache/distfiles
```

Damit kann nachts kein Download-Fehler den Lauf stoppen.

### 7.7 Nacht-Skript

```bash
cat > /root/nacht.sh <<'EOF'
#!/bin/bash
# Unbeaufsichtigter Nacht-Build. --keep-going laesst Portage nach einem Fehler weitermachen.
LOG=/var/log/nacht-$(date +%F_%H%M).log
export LC_ALL=C
{
  echo "=== Start: $(date)"
  free -g; df -h /var/tmp
  emerge --verbose --update --deep --newuse --keep-going @world @desktop-gaming
  echo "=== Haupt-Emerge fertig (rc=$?): $(date)"
  emerge --keep-going @preserved-rebuild
  echo "=== Gescheiterte Pakete (Build-Verzeichnisse bleiben erhalten):"
  ls -d /var/tmp/portage/*/* 2>/dev/null
  echo "=== Ende: $(date)"
} 2>&1 | tee "$LOG"
EOF
chmod +x /root/nacht.sh
```

Nie `--ask` in das Skript schreiben, sonst wartet es nachts auf eine Eingabe.

### 7.8 Starten

```bash
/root/nacht.sh
```

Dann `Strg+b`, `d` zum Abhängen. Der Rechner darf nicht ausgeschaltet werden, der Monitor kann aus. Fortschritt jederzeit mit:

```bash
tmux attach -t nacht
```

oder in einem zweiten Terminal:

```bash
sudo genlop -c
sudo tail -f /var/log/nacht-*.log
```

Erwartete Dauer auf dem 7500F: 6 bis 10 Stunden. Die größten Brocken sind Qt (ca. 1 h), KDE Frameworks und Plasma (2 bis 3 h), clang/lld (ca. 45 min), 32-Bit-LLVM für Mesa (ca. 40 min), Firefox (ca. 1 h) und die 32-Bit-Bibliotheken für Steam (ca. 1 h). Das sind Schätzwerte, die echten Zeiten zeigt morgens `qlop -tvHl`.

---

## 8. Am nächsten Morgen: Ergebnis prüfen, Plasma starten (etwa 30 min)

### 8.1 Fehler prüfen

```bash
sudo -i
tail -n 60 /var/log/nacht-*.log
```

Gab es Fehler (Block "packages have failed to build"), denselben Befehl erneut starten. Alles Fertige wird übersprungen:

```bash
emerge --verbose --update --deep --newuse --keep-going @world @desktop-gaming
```

Bleibt ein Paket hartnäckig, das Bau-Log ansehen:

```bash
ls /var/log/portage/build/*/
less /var/log/portage/build/<kategorie>/<paket>-<version>:<datum>.log
```

Konfigurationsänderungen übernehmen, Hinweise lesen, Bauzeiten anschauen:

```bash
dispatch-conf
eselect news read
elogv
qlop -tvHl
```

### 8.2 Dienste und Gruppen

Login-Manager, Audio-Dienste für alle Benutzer, Bluetooth, Energieprofile:

```bash
systemctl enable sddm.service
systemctl set-default graphical.target
systemctl --global enable pipewire.socket pipewire-pulse.socket wireplumber.service
systemctl enable --now bluetooth.service power-profiles-daemon.service
```

Gruppen für gamemode und PipeWire-Echtzeit:

```bash
usermod -aG gamemode,pipewire lewin
```

Flatpak-Quelle einrichten (systemweit):

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Neustart:

```bash
reboot
```

### 8.3 Erster Plasma-Login

Im SDDM-Login unten links die Sitzung "Plasma (Wayland)" wählen. Anmelden. Beim ersten Mal kann es wegen der Shader-Caches ein paar Sekunden länger dauern.

Die Sitzung "Plasma (X11)" gibt es als Notnagel bis Plasma 6.7, ab 6.8 ist Plasma reines Wayland.

---

## 9. Plasma einrichten: Sprache, Monitor 180 Hz, Audio, Firefox (etwa 45 min)

### 9.1 Sprache und Tastatur

Durch `LANG=de_DE.UTF-8` ist Plasma bereits deutsch. Zum Prüfen: Systemeinstellungen > Region und Sprache. Tastatur: Systemeinstellungen > Tastatur > Belegungen > "Deutsch" hinzufügen.

### 9.2 Monitor: 1080p bei 180 Hz und Adaptive Sync

Voraussetzung: DisplayPort-Kabel. Im Monitor-OSD "Adaptive-Sync" beziehungsweise "VRR" einschalten, sonst meldet der Monitor die Fähigkeit nicht.

Systemeinstellungen > Anzeige und Monitor > Anzeige-Einrichtung:

- Bildwiederholrate: 180 Hz
- Adaptive Synchronisation: Automatisch (Plasma setzt hier standardmäßig "Nie", das muss man umstellen)
- Ganz unten: "Screen tearing: In Vollbildfenstern erlauben" anhaken (weniger Latenz in Spielen)

Per Terminal prüfen und setzen:

```bash
kscreen-doctor -o
kscreen-doctor output.DP-1.mode.1920x1080@180 output.DP-1.vrrpolicy.automatic
cat /sys/class/drm/card*-DP-*/vrr_capable
```

Der Ausgabename (`DP-1`, `DP-2`) steht in der ersten Ausgabe. `vrr_capable` muss `1` zeigen, sonst ist VRR im OSD aus oder das Kabel ungeeignet.

Der Login-Bildschirm läuft mit 60 Hz, das ist harmlos. Wer ihn auch auf 180 Hz will, braucht den Wayland-Greeter von SDDM (bei Gentoo als experimentell markiert):

```bash
echo 'gui-apps/sddm-gentoo-config kwin' | sudo tee /etc/portage/package.use/sddm
sudo emerge --ask --oneshot --newuse gui-apps/sddm-gentoo-config
```

Danach in Systemeinstellungen > Farben und Design > Anmeldebildschirm (SDDM) auf "Plasma-Einstellungen anwenden" klicken. Zeigt der Login danach nur Schwarz, das Flag wieder entfernen und den Befehl wiederholen.

### 9.3 Audio: NVIDIA HDMI/DP-Audio

"NVIDIA High Definition Audio" ist der Audio-Teil der Grafikkarte, der den Ton per DisplayPort oder HDMI an den Monitor schickt. Treiber im Kernel: `snd_hda_intel` plus `snd_hda_codec_hdmi`, beide im Binär-Kernel enthalten. PipeWire übernimmt den Rest, der NVIDIA-Treiber hat damit nichts zu tun.

Prüfen:

```bash
cat /proc/asound/cards
wpctl status
```

Dort muss eine Karte "NVidia" (HDA NVidia) und eine Karte für den Onboard-Codec (Realtek, "Family 17h/19h HD Audio") auftauchen. Dann im Plasma-Lautstärkeregler unten rechts das Ausgabegerät wählen: "HDA NVidia ... (HDMI/DP)" für den Monitor oder "Analog Stereo" für die Klinkenbuchse am Mainboard.

Wichtig: Der NVIDIA-Ausgang erscheint nur, wenn der Monitor Lautsprecher oder eine Kopfhörerbuchse hat und das per DisplayPort meldet. Ein Monitor ohne Audio zeigt keinen NVIDIA-Ausgang, das ist kein Fehler.

Falls der Ton knackt oder die erste Sekunde fehlt (automatisches Schlafenlegen der Codecs):

```bash
echo 'options snd_hda_intel power_save=0' | sudo tee /etc/modprobe.d/snd-hda-intel.conf
```

Gilt nach dem nächsten Neustart. Keine PulseAudio-Pakete installieren, `media-sound/pulseaudio-daemon` wird von PipeWire blockiert.

### 9.4 Firefox

Firefox startet nativ unter Wayland und ist durch das Sprachpaket (`www-client/firefox-l10n`) deutsch. Prüfen in `about:support`: "Window Protocol: wayland".

Hardware-Video-Decoding auf der RTX 4070 SUPER (optional, das Paket ist testing und nutzt eine inoffizielle NVIDIA-Schnittstelle):

```bash
echo 'media-libs/nvidia-vaapi-driver ~amd64' | sudo tee /etc/portage/package.accept_keywords/nvidia-vaapi
sudo emerge --ask media-libs/nvidia-vaapi-driver media-video/libva-utils
```

Umgebungsvariablen für die Plasma-Sitzung in `~/.config/environment.d/90-nvidia-vaapi.conf`:

```text
LIBVA_DRIVER_NAME=nvidia
NVD_BACKEND=direct
MOZ_DISABLE_RDD_SANDBOX=1
```

In Firefox `about:config`: `media.hardware-video-decoding.force-enabled` auf `true` (NVIDIA steht nicht auf Mozillas Freigabeliste, daher erzwingen). Die alte Einstellung `media.ffmpeg.vaapi.enabled` gibt es seit Firefox 137 nicht mehr. Ab- und wieder anmelden, dann testen:

```bash
vainfo
```

Es müssen Zeilen mit `VAProfileH264`, `VAProfileHEVC` und `VAProfileAV1` erscheinen. In `about:support` steht dann bei "HARDWARE_VIDEO_DECODING" der Wert "available". AV1 bleibt aktiv, die RTX 4070 SUPER dekodiert AV1 in Hardware.

Hinweis: `MOZ_DISABLE_RDD_SANDBOX=1` schaltet die Sandbox des Decoder-Prozesses ab. Das ist der bekannte Preis für NVIDIA-Hardware-Decoding in Firefox.

### 9.5 Energieprofile und Sensoren

In Plasma erscheint im Energie-Applet "Leistung / Ausgeglichen / Energiesparen". Das steuert auf dem Zen 4 den EPP-Hinweis von amd-pstate. Für Spiele "Leistung" wählen.

Sensoren einmalig einrichten:

```bash
sudo sensors-detect
sudo systemctl enable --now lm_sensors.service
sensors
```

Bei sensors-detect alle Fragen mit Enter (Standard) beantworten. `k10temp` zeigt die CPU-Temperatur, `nvidia-smi` die GPU.

Resizable BAR prüfen:

```bash
nvidia-smi -q | grep -A3 BAR1
```

Steht bei "Total" ein Wert in der Größenordnung des VRAM (nicht 256 MiB), ist ReBAR aktiv.

---

## 10. Gaming einrichten: Steam, MangoHud, GOverlay, Heroic, gamemode (etwa 45 min)

### 10.1 Steam

Steam aus dem Anwendungsmenü starten. Beim ersten Start lädt es den eigentlichen Client (ca. 500 MB) nach `~/.local/share/Steam`. Anmelden.

Proton für alle Windows-Spiele: Steam > Einstellungen > Kompatibilität > "Steam Play für alle anderen Titel aktivieren", Version "Proton Experimental" oder die neueste nummerierte.

Prüfen, ob Vulkan in 64 und 32 Bit läuft:

```bash
vulkaninfo --summary | grep -E 'deviceName|driverName'
ls /usr/lib32/libGLX_nvidia.so* /usr/lib32/libnvidia-glcore.so*
MANGOHUD=1 vkcube
```

Die erste Zeile muss "NVIDIA GeForce RTX 4070 SUPER" zeigen, die zweite die 32-Bit-Dateien, `vkcube` einen rotierenden Würfel mit MangoHud-Overlay (Fenster schließen zum Beenden).

Steam läuft auf Plasma Wayland über XWayland, das ist normal und funktioniert.

### 10.2 MangoHud

Pro Spiel in den Startoptionen (Rechtsklick auf das Spiel > Eigenschaften > Startoptionen):

```text
gamemoderun mangohud %command%
```

Für alle Vulkan-Spiele global in `~/.config/environment.d/mangohud.conf`:

```text
MANGOHUD=1
```

Konfiguration in `~/.config/MangoHud/MangoHud.conf`, zum Beispiel:

```ini
fps
frametime
frame_timing
gpu_stats
gpu_temp
cpu_stats
cpu_temp
ram
vram
position=top-left
font_size=22
toggle_hud=Shift_R+F12
```

GPU-Werte kommen auf der RTX 4070 SUPER über NVML, das funktioniert auch unter Wayland ohne weitere Flags.

### 10.3 GOverlay

GOverlay ist die grafische Oberfläche für MangoHud und wird vom Entwickler als Flatpak empfohlen:

```bash
flatpak install flathub io.github.benjamimgois.goverlay
```

Flatpak lädt dabei automatisch die passende NVIDIA-Runtime (`org.freedesktop.Platform.GL.nvidia-595-104-02`). GOverlay aus dem Anwendungsmenü starten, Einstellungen anpassen, "Speichern". Es schreibt dieselbe Datei `~/.config/MangoHud/MangoHud.conf`, die Steam und Heroic benutzen. Der GameMode-Schalter ist im Flatpak ausgeblendet, gamemode wird stattdessen über `gamemoderun` in den Startoptionen gesteuert.

Alternativen: das AppImage von https://github.com/benjamimgois/goverlay/releases oder die Gentoo-Version `games-util/goverlay` aus GURU. Letztere ist Version 1.2 (sehr alt) und braucht den Free-Pascal- und Lazarus-Compiler (`dev-lang/lazarus qt6`, `dev-lang/fpc source` in package.use).

Nach jedem Update von `x11-drivers/nvidia-drivers` einmal `flatpak update` ausführen, damit die NVIDIA-Runtime der Flatpaks zur Treiberversion passt.

### 10.4 Heroic Games Launcher (Epic, GOG, Amazon)

Heroic ist nativ installiert (`games-util/heroic-bin`, Menüeintrag "Heroic Games Launcher"). Beim ersten Start: Einstellungen > Wine-Manager > neueste "Proton-CachyOS" oder "GE-Proton" installieren (Proton-CachyOS ist seit Heroic 2.22 der Standard). Pro Spiel oder in den globalen Einstellungen: "Enable Mangohud" und "Use GameMode" einschalten. Heroic nutzt dafür direkt das System-MangoHud und gamemode.

### 10.5 gamemode

gamemode läuft als Benutzerdienst und startet sich bei Bedarf selbst. Test:

```bash
gamemoded -t
```

Alle Tests müssen "passed" melden. Falls "not in gamemode group": Abschnitt 8.2 (Gruppe) und neu anmelden. Auf dem Zen 4 mit amd-pstate ist der CPU-Governor-Wechsel von gamemode klein, der Nutzen liegt bei Prozesspriorität und dem Abschalten des Bildschirmschoners.

### 10.6 Proton-GE für Steam (optional)

Für Steam genügt meist Proton Experimental. Wer GE-Proton will:

```bash
flatpak install flathub net.davidotek.pupgui2
```

ProtonUp-Qt starten, "Add version" > GE-Proton > Install. Danach Steam neu starten und das Spiel in den Eigenschaften auf GE-Proton stellen.

---

## 11. Optional: Kernel aus den Quellen (zweite Nacht)

Der Binär-Kernel ist vollwertig und bekommt Sicherheitsupdates. Wer den Kernel wie den Rest aus den Quellen haben will:

```bash
sudo -i
emerge --ask sys-kernel/gentoo-kernel
```

Das baut den Gentoo-Distribution-Kernel mit derselben Konfiguration wie der Binär-Kernel, auf dem 7500F etwa 30 bis 60 Minuten. Danach, noch vor dem Neustart, das NVIDIA-Modul für den neuen Kernel bauen:

```bash
eselect kernel list
eselect kernel set linux-6.18.54-gentoo-dist
emerge --ask @module-rebuild
```

Die Versionsnummer an die Ausgabe von `eselect kernel list` anpassen. Das passiert hier nicht automatisch, weil beide Kernel dieselbe Version haben.

GRUB sortiert den Eintrag `-dist-bin` nach oben. Beim Neustart im GRUB-Menü den Eintrag ohne `-bin` wählen, dann prüfen:

```bash
uname -r
lsmod | grep nvidia
```

Läuft alles, den Binär-Kernel entfernen:

```bash
sudo -i
emerge --ask --deselect sys-kernel/gentoo-kernel-bin
emerge --ask --depclean
emerge --ask app-admin/eclean-kernel
eclean-kernel -n 1 -p
eclean-kernel -n 1
grub-mkconfig -o /boot/grub/grub.cfg
```

`eclean-kernel -n 1 -p` ist der Probelauf, er muss den laufenden Kernel behalten.

Eine eigene, abgespeckte Kernel-Konfiguration geht über Dateien in `/etc/kernel/config.d/` oder `USE=savedconfig`. Für den Anfang nicht nötig.

---

## 12. Alltag: Updates und Pflege

```bash
sudo -i
emerge --sync
eselect news read
emerge --ask --verbose --update --deep --newuse @world
emerge --ask --depclean
dispatch-conf
eclean-distfiles
```

Nach Kernel-Updates baut `dist-kernel` das NVIDIA-Modul automatisch. Nach NVIDIA-Treiber-Updates: Neustart, danach `flatpak update`. Nach größeren Updates:

```bash
emerge --ask @preserved-rebuild
```

Overlays werden bei `emerge --sync` mitaktualisiert.

---

## 13. Fehlerbehebung

**Boot hängt etwa zwei Minuten mit "A start job is running for Wait for Network"**
systemd-networkd ist noch aktiv: `sudo systemctl disable --now systemd-networkd systemd-networkd-wait-online`.

**Schwarzer Bildschirm nach SDDM / Plasma startet nicht**
`Strg+Alt+F3`, anmelden, dann `journalctl -b -u sddm` und `journalctl --user -b | grep -i kwin`. Prüfen: `cat /sys/module/nvidia_drm/parameters/modeset` muss `Y` sein, `lsmod | grep nvidia` muss die Module zeigen. Notlösung: im SDDM die Sitzung "Plasma (X11)" wählen.

**NVIDIA-Modul lädt nicht ("Key was rejected", "unsigned module")**
Secure Boot im UEFI abschalten.

**Nach einem Treiber-Update: "API mismatch" in dmesg**
Alte Module werden noch geladen. Neustart. Falls es bleibt: `sudo emerge --config sys-kernel/gentoo-kernel-bin` (Initramfs neu) und Neustart.

**Steam startet nicht oder meldet fehlende 32-Bit-Bibliotheken**
`ls /usr/lib32/libGLX_nvidia.so*` prüfen. Fehlt die Datei: `sudo emerge --ask --verbose --changed-use --deep @world`. Meldet Portage dabei USE-Änderungen, diese mit `dispatch-conf` übernehmen.

**MangoHud erscheint in einem Spiel nicht**
32-Bit-Spiel ohne 32-Bit-MangoHud: `equery uses games-util/mangohud` muss `+abi_x86_32` zeigen. OpenGL-Spiele brauchen das `mangohud`-Präfix in den Startoptionen, `MANGOHUD=1` allein reicht nur für Vulkan.

**Flatpak-Spiel oder GOverlay ohne GPU-Beschleunigung**
`flatpak update`, danach `flatpak list --runtime | grep nvidia` mit `nvidia-smi` vergleichen. Die Versionen müssen übereinstimmen.

**Kein WLAN nach dem Boot**
`nmcli device status`, `sudo dmesg | grep -i firmware`, `rfkill list`. Bei MediaTek-Chips keine `~amd64`-Version von `linux-firmware` einspielen, dort gab es 2025 Snapshots, die den Treiber `mt7921e` einfrieren ließen.

**Kein Ton**
`wpctl status` zeigt alle Ausgänge. Mit `wpctl set-default <ID>` den gewünschten setzen. Benutzerdienste prüfen: `systemctl --user status pipewire.socket wireplumber.service`. Falls nicht aktiv: Abschnitt 8.2.

**VRR lässt sich nicht einschalten**
`cat /sys/class/drm/card*-DP-*/vrr_capable` muss `1` sein. Sonst Adaptive-Sync im Monitor-OSD aktivieren und DisplayPort statt HDMI verwenden. Flackert die Helligkeit auf dem Desktop, VRR auf "Automatisch" statt "Immer" stellen.

**Nacht-Build: Paket gescheitert**
Log unter `/var/log/portage/build/` lesen. Bei Speicherproblemen das einzelne Paket mit weniger Jobs bauen: `MAKEOPTS="-j6" emerge --ask --oneshot kategorie/paket`. Dann den großen Emerge-Befehl erneut starten.

**Portage meldet "masked by: ~amd64 keyword"**
Paket in `/etc/portage/package.accept_keywords/gaming` eintragen (Abschnitt 7.2).

**Portage meldet Konflikte (Blocker)**
Meist hilft `emerge --ask --verbose --update --deep --newuse --backtrack=50 @world @desktop-gaming`.

**"Programm als Root ausführen" in Plasma fragt nach dem Root-Passwort statt dem eigenen**
kdesu nutzt standardmäßig `su`. Umstellen auf sudo in `~/.config/kdesurc`:

```ini
[super-user-command]
super-user-command=sudo
```

---

## 14. Spickzettel

| Aufgabe | Befehl |
| --- | --- |
| Paketbaum aktualisieren | `emerge --sync` |
| Paket installieren | `emerge --ask kategorie/paket` |
| Paket suchen | `emerge --search name` |
| System aktualisieren | `emerge --ask --verbose --update --deep --newuse @world` |
| Unbenutztes entfernen | `emerge --ask --depclean` |
| Konfigs mergen | `dispatch-conf` |
| USE-Flags eines Pakets | `equery uses kategorie/paket` |
| Wer braucht Paket X | `equery depends kategorie/paket` |
| Bauzeiten | `qlop -tvH kategorie/paket` |
| Laufender Build | `genlop -c` oder `qlop -r` |
| NVIDIA-Modul neu bauen | `emerge --ask @module-rebuild` |
| Initramfs und GRUB-Menü neu | `emerge --config sys-kernel/gentoo-kernel-bin` |
| Kernel-Liste | `eselect kernel list` |
| Nachrichten | `eselect news read` |
| Overlay-Liste | `eselect repository list -i` |
| Audio-Geräte | `wpctl status` |
| Monitor-Modi | `kscreen-doctor -o` |
| GPU-Status | `nvidia-smi` |
