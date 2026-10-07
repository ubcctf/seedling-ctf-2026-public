import matplotlib.pyplot as plt

# Open the file and read every byte into memory.
pcap_file = open("sketch.pcap", "rb")
file_bytes = pcap_file.read()
pcap_file.close()

# The first 24 bytes of any pcap file are a header we don't need.
position = 24

# We'll build up a list of strokes. Each stroke is a list of (x, y) points.
all_strokes = []
current_stroke = []

while position < len(file_bytes):
    # Each captured frame starts with a 16-byte header.
    # Bytes 8-11 of that header tell us how many bytes the frame is.
    length_bytes = file_bytes[position + 8 : position + 12]
    frame_length = int.from_bytes(length_bytes, byteorder="little")

    # Move past that 16-byte header.
    position = position + 16

    # Grab the actual frame.
    frame = file_bytes[position : position + frame_length]
    position = position + frame_length

    # This capture uses a 64-byte USB header before the real data.
    # The real data (the "payload") is whatever comes after those 64 bytes.
    payload = frame[64:]

    # We only care about payloads that are exactly 8 bytes long.
    # That's the size of one pen position report.
    if len(payload) != 8:
        continue

    # Byte 1 of the payload holds some flags.
    # The lowest bit tells us if the pen is touching the tablet (1) or not (0).
    flags_byte = payload[1]
    pen_is_down = flags_byte & 1

    # Bytes 2-3 are the X position, bytes 4-5 are the Y position.
    # Both are stored little-endian (least significant byte first).
    x = int.from_bytes(payload[2:4], byteorder="little")
    y = int.from_bytes(payload[4:6], byteorder="little")

    if pen_is_down == 1:
        # Pen is touching -> add this point to the stroke we're drawing.
        current_stroke.append((x, y))
    else:
        # Pen lifted -> finish the current stroke (if it has any points).
        if len(current_stroke) > 0:
            all_strokes.append(current_stroke)
            current_stroke = []

# In case the file ends while the pen is still "down".
if len(current_stroke) > 0:
    all_strokes.append(current_stroke)

print("Found", len(all_strokes), "strokes")

# Now draw every stroke as its own line, so strokes don't connect to each other.
for stroke in all_strokes:
    x_values = []
    y_values = []
    for point in stroke:
        x_values.append(point[0])
        y_values.append(point[1])
    plt.plot(x_values, y_values, color="black")

plt.gca().invert_yaxis()  # tablets count y from the top, matplotlib from the bottom
plt.axis("off")  # hide the chart axes, we just want the drawing
plt.savefig("sketch_output.png", facecolor="white")

print("Saved drawing to sketch_output.png")
