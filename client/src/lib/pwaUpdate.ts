export function shouldShowPwaUpdate(input: {
  standalone: boolean;
  hadExistingController: boolean;
}) {
  return input.standalone && input.hadExistingController;
}
