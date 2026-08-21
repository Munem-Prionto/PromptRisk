#!/usr/bin/perl
# One-off generator for the extension's PNG icons (padlock glyph on a flat square).
# Not part of the shipped extension; run with: perl icons/gen_icons.pl
use strict;
use warnings;
use Compress::Zlib;

my @BG = (31, 41, 55);      # #1F2937
my @FG = (255, 255, 255);   # white lock

sub chunk {
    my ($type, $data) = @_;
    my $len = pack('N', length($data));
    my $crc = pack('N', crc32($type . $data));
    return $len . $type . $data . $crc;
}

sub pixel_color {
    my ($x, $y, $n) = @_;
    my $cx = $n / 2.0;
    my $cy = $n * 0.46;
    my $ro = $n * 0.22;
    my $ri = $n * 0.13;

    # shackle: ring between ri and ro, upper half only
    my $dx = $x + 0.5 - $cx;
    my $dy = $y + 0.5 - $cy;
    my $d = sqrt($dx * $dx + $dy * $dy);
    if ($dy <= 0 && $d >= $ri && $d <= $ro) {
        return @FG;
    }

    # body: rounded rectangle
    my $bx0 = $n * 0.27;
    my $bx1 = $n * 0.73;
    my $by0 = $n * 0.48;
    my $by1 = $n * 0.86;
    my $r = $n * 0.06;
    if ($x + 0.5 >= $bx0 && $x + 0.5 <= $bx1 && $y + 0.5 >= $by0 && $y + 0.5 <= $by1) {
        # corner rounding check
        my $inCornerX = ($x + 0.5 < $bx0 + $r) || ($x + 0.5 > $bx1 - $r);
        my $inCornerY = ($y + 0.5 < $by0 + $r) || ($y + 0.5 > $by1 - $r);
        if ($inCornerX && $inCornerY) {
            my $ccx = ($x + 0.5 < $bx0 + $r) ? $bx0 + $r : $bx1 - $r;
            my $ccy = ($y + 0.5 < $by0 + $r) ? $by0 + $r : $by1 - $r;
            my $cdx = $x + 0.5 - $ccx;
            my $cdy = $y + 0.5 - $ccy;
            return @FG if sqrt($cdx * $cdx + $cdy * $cdy) <= $r;
            return @BG;
        }
        return @FG;
    }

    # keyhole cutout inside the body (small BG dot + slot)
    my $kcx = $n * 0.5;
    my $kcy = $n * 0.62;
    my $kr = $n * 0.045;
    my $kdx = $x + 0.5 - $kcx;
    my $kdy = $y + 0.5 - $kcy;
    if (sqrt($kdx * $kdx + $kdy * $kdy) <= $kr) {
        return @BG;
    }
    if ($x + 0.5 >= $kcx - $kr * 0.6 && $x + 0.5 <= $kcx + $kr * 0.6 &&
        $y + 0.5 >= $kcy && $y + 0.5 <= $kcy + $n * 0.09) {
        return @BG;
    }

    return @BG;
}

sub make_png {
    my ($n, $path) = @_;
    my $raw = '';
    for (my $y = 0; $y < $n; $y++) {
        $raw .= "\x00"; # filter: none
        for (my $x = 0; $x < $n; $x++) {
            my ($r, $g, $b) = pixel_color($x, $y, $n);
            $raw .= pack('CCCC', $r, $g, $b, 255);
        }
    }

    my $ihdr = pack('NNCCCCC', $n, $n, 8, 6, 0, 0, 0);
    my $idat = compress($raw);

    open(my $fh, '>:raw', $path) or die "cannot open $path: $!";
    print $fh "\x89PNG\r\n\x1a\n";
    print $fh chunk('IHDR', $ihdr);
    print $fh chunk('IDAT', $idat);
    print $fh chunk('IEND', '');
    close($fh);
}

make_png(16, 'icons/16.png');
make_png(32, 'icons/32.png');
make_png(48, 'icons/48.png');
make_png(128, 'icons/128.png');

print "icons generated\n";
